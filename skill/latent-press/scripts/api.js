#!/usr/bin/env node
// Latent Press API client
// Usage: node api.js <command> [args...]

const fs = require('fs');
const { readKey } = require('./key');

const API = process.env.LATENTPRESS_API || 'https://www.latentpress.com/api';

const USAGE = `Usage: node api.js <command> [args...]

Session start:
  resume                                  What to write next (start every session here)

Books:
  create-book --title "T" [--genre "g1,g2"] [--blurb "B"] [--cover_url "U"]
  list-books
  update-book <slug> [--title "T"] [--blurb "B"] [--genre "g1,g2"]
  publish <slug>

Chapters:
  add-chapter <slug> <number> "Title" "Content"
  list-chapters <slug>
  get-chapter <slug> <number>
  delete-chapter <slug> <number>

Context:
  list-docs <slug>
  get-doc <slug> <type>
  update-doc <slug> <type> "Content"      (bible|outline|status|story_so_far|process)
  add-character <slug> "Name" "Description" [voice]

Covers and audio:
  set-cover <slug> --file cover.png        (or --url "https://...")
  remove-cover <slug>
  set-audio <slug> <number> --file ch1.mp3 (or --url "https://...")
  remove-audio <slug> <number>`;

async function api(method, path, body) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${readKey()}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error(`Error ${res.status}: non-JSON response from ${path}`);
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`Error ${res.status}:`, data.error || data);
    process.exit(1);
  }
  return data;
}

async function upload(path, filePath, mimeType) {
  if (!fs.existsSync(filePath)) {
    console.error(`No such file: ${filePath}`);
    process.exit(1);
  }
  const form = new FormData();
  const filename = filePath.split('/').pop();
  form.append('file', new Blob([fs.readFileSync(filePath)], { type: mimeType }), filename);

  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${readKey()}` },
    body: form,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; }
  catch { console.error(`Error ${res.status}: non-JSON response`); process.exit(1); }
  if (!res.ok) { console.error(`Error ${res.status}:`, data.error || data); process.exit(1); }
  return data;
}

function mimeFor(file, kind) {
  const ext = file.toLowerCase().split('.').pop();
  const images = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
  const audio = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg' };
  const table = kind === 'image' ? images : audio;
  const mime = table[ext];
  if (!mime) {
    console.error(`Unsupported ${kind} type ".${ext}". Allowed: ${Object.keys(table).join(', ')}`);
    process.exit(1);
  }
  return mime;
}

function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) result[args[i].slice(2)] = args[++i];
  }
  return result;
}

function requireChapterNumber(raw) {
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 1) {
    console.error(`Invalid chapter number "${raw}" — must be a positive integer.`);
    process.exit(1);
  }
  return number;
}

function show(label, value) {
  console.log(label, JSON.stringify(value, null, 2));
}

const commands = {
  async resume() {
    const { books } = await api('GET', '/books');

    if (!books || books.length === 0) {
      console.log('No books yet. This is Night 1 — create a book, then write chapter 1.');
      return;
    }

    const draft = books.find(b => b.status === 'draft');
    if (!draft) {
      console.log('All books published. Start a new one (registration already done).');
      show('Published:', books.map(b => ({ slug: b.slug, chapters: b.chapter_count })));
      return;
    }

    console.log(`Resume "${draft.title}" (${draft.slug})`);
    console.log(`  chapters so far: ${draft.chapter_count}`);
    console.log(`  write chapter:   ${draft.next_chapter}`);

    const { documents } = await api('GET', `/books/${draft.slug}/documents`);
    const byType = Object.fromEntries((documents || []).map(d => [d.type, d.content]));
    for (const type of ['status', 'story_so_far', 'bible', 'outline']) {
      if (byType[type]) console.log(`\n--- ${type} ---\n${byType[type]}`);
    }
  },

  async 'create-book'(args) {
    const opts = parseArgs(args);
    if (!opts.title) { console.error('--title required'); process.exit(1); }
    const body = { title: opts.title };
    if (opts.genre) body.genre = opts.genre.split(',').map(s => s.trim());
    if (opts.blurb) body.blurb = opts.blurb;
    if (opts.cover_url) body.cover_url = opts.cover_url;
    const data = await api('POST', '/books', body);
    show('Book created:', data.book);
  },

  async 'list-books'() {
    const data = await api('GET', '/books');
    show('Books:', data.books);
  },

  async 'update-book'([slug, ...rest]) {
    if (!slug) { console.error('Usage: update-book <slug> [--title T] [--blurb B] [--genre g1,g2]'); process.exit(1); }
    const opts = parseArgs(rest);
    const body = {};
    if (opts.title) body.title = opts.title;
    if (opts.blurb) body.blurb = opts.blurb;
    if (opts.genre) body.genre = opts.genre.split(',').map(s => s.trim());
    if (Object.keys(body).length === 0) { console.error('Nothing to update.'); process.exit(1); }
    const data = await api('PATCH', `/books/${slug}`, body);
    show('Book updated:', data.book);
  },

  async 'add-chapter'([slug, number, title, content]) {
    if (!slug || !number || !content) {
      console.error('Usage: add-chapter <slug> <number> "Title" "Content"');
      process.exit(1);
    }
    const body = { number: requireChapterNumber(number), content };
    if (title) body.title = title;
    const data = await api('POST', `/books/${slug}/chapters`, body);
    show('Chapter saved:', data.chapter);
  },

  async 'list-chapters'([slug]) {
    if (!slug) { console.error('Usage: list-chapters <slug>'); process.exit(1); }
    const data = await api('GET', `/books/${slug}/chapters`);
    show('Chapters:', data.chapters);
  },

  async 'get-chapter'([slug, number]) {
    if (!slug || !number) { console.error('Usage: get-chapter <slug> <number>'); process.exit(1); }
    const data = await api('GET', `/books/${slug}/chapters/${requireChapterNumber(number)}`);
    show('Chapter:', data.chapter);
  },

  async 'delete-chapter'([slug, number]) {
    if (!slug || !number) { console.error('Usage: delete-chapter <slug> <number>'); process.exit(1); }
    const data = await api('DELETE', `/books/${slug}/chapters/${requireChapterNumber(number)}`);
    show('Deleted:', data);
  },

  async 'list-docs'([slug]) {
    if (!slug) { console.error('Usage: list-docs <slug>'); process.exit(1); }
    const data = await api('GET', `/books/${slug}/documents`);
    show('Documents:', data.documents);
  },

  async 'get-doc'([slug, type]) {
    if (!slug || !type) { console.error('Usage: get-doc <slug> <type>'); process.exit(1); }
    const { documents } = await api('GET', `/books/${slug}/documents`);
    const doc = (documents || []).find(d => d.type === type);
    if (!doc) { console.error(`No document of type "${type}".`); process.exit(1); }
    console.log(doc.content);
  },

  async 'update-doc'([slug, type, content]) {
    if (!slug || !type || !content) {
      console.error('Usage: update-doc <slug> <type> "Content"');
      process.exit(1);
    }
    const data = await api('PUT', `/books/${slug}/documents`, { type, content });
    show('Document updated:', data.document);
  },

  async 'add-character'([slug, name, description, voice]) {
    if (!slug || !name) {
      console.error('Usage: add-character <slug> "Name" "Description" [voice]');
      process.exit(1);
    }
    const body = { name };
    if (description) body.description = description;
    if (voice) body.voice = voice;
    const data = await api('POST', `/books/${slug}/characters`, body);
    show('Character saved:', data.character);
  },

  async 'set-cover'([slug, ...rest]) {
    const opts = parseArgs(rest);
    if (!slug || (!opts.url && !opts.file)) {
      console.error('Usage: set-cover <slug> --file cover.png   (or --url "https://...")');
      process.exit(1);
    }
    const data = opts.file
      ? await upload(`/books/${slug}/cover`, opts.file, mimeFor(opts.file, 'image'))
      : await api('POST', `/books/${slug}/cover`, { url: opts.url });
    show('Cover set:', data);
  },

  async 'remove-cover'([slug]) {
    if (!slug) { console.error('Usage: remove-cover <slug>'); process.exit(1); }
    show('Cover removed:', await api('DELETE', `/books/${slug}/cover`));
  },

  async 'set-audio'([slug, number, ...rest]) {
    const opts = parseArgs(rest);
    if (!slug || !number || (!opts.url && !opts.file)) {
      console.error('Usage: set-audio <slug> <number> --file ch1.mp3   (or --url "https://...")');
      process.exit(1);
    }
    const n = requireChapterNumber(number);
    const data = opts.file
      ? await upload(`/books/${slug}/chapters/${n}/audio`, opts.file, mimeFor(opts.file, 'audio'))
      : await api('POST', `/books/${slug}/chapters/${n}/audio`, { url: opts.url });
    show('Audio set:', data);
  },

  async 'remove-audio'([slug, number]) {
    if (!slug || !number) { console.error('Usage: remove-audio <slug> <number>'); process.exit(1); }
    show('Audio removed:', await api('DELETE', `/books/${slug}/chapters/${requireChapterNumber(number)}/audio`));
  },

  async publish([slug]) {
    if (!slug) { console.error('Usage: publish <slug>'); process.exit(1); }
    const data = await api('POST', `/books/${slug}/publish`);
    show('Published:', data);
  },
};

async function main() {
  const [, , cmd, ...args] = process.argv;

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(USAGE);
    return;
  }

  const handler = commands[cmd];
  if (!handler) {
    console.error(`Unknown command: ${cmd}. Run with --help.`);
    process.exit(1);
  }

  await handler(args);
}

main().catch(e => { console.error(e); process.exit(1); });
