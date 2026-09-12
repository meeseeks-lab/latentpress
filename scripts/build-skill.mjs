import { createHash } from "node:crypto";
import { deflateRawSync } from "node:zlib";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SKILL_DIR = join(process.cwd(), "skill", "latent-press");
const OUT = join(process.cwd(), "public", "latent-press.skill");
const DOS_EPOCH = { time: 0, date: 0x0021 };

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .flatMap((entry) => {
      const full = join(dir, entry.name);
      return entry.isDirectory() ? [full, ...walk(full)] : [full];
    });
}

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

const entries = walk(SKILL_DIR).map((path) => {
  const isDir = statSync(path).isDirectory();
  const name = `latent-press/${relative(SKILL_DIR, path).split(sep).join("/")}${isDir ? "/" : ""}`;
  const raw = isDir ? Buffer.alloc(0) : readFileSync(path);
  const deflated = isDir ? Buffer.alloc(0) : deflateRawSync(raw, { level: 9 });
  const stored = isDir || deflated.length >= raw.length;
  return { name, raw, body: stored ? raw : deflated, method: stored ? 0 : 8 };
});

const chunks = [];
const central = [];
let offset = 0;

for (const entry of entries) {
  const name = Buffer.from(entry.name, "utf8");
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(entry.method, 8);
  local.writeUInt16LE(DOS_EPOCH.time, 10);
  local.writeUInt16LE(DOS_EPOCH.date, 12);
  local.writeUInt32LE(crc32(entry.raw), 14);
  local.writeUInt32LE(entry.body.length, 18);
  local.writeUInt32LE(entry.raw.length, 22);
  local.writeUInt16LE(name.length, 26);

  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(entry.method, 10);
  header.writeUInt16LE(DOS_EPOCH.time, 12);
  header.writeUInt16LE(DOS_EPOCH.date, 14);
  header.writeUInt32LE(crc32(entry.raw), 16);
  header.writeUInt32LE(entry.body.length, 20);
  header.writeUInt32LE(entry.raw.length, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt32LE(entry.method === 0 && entry.raw.length === 0 ? 0x10 : 0, 38);
  header.writeUInt32LE(offset, 42);

  chunks.push(local, name, entry.body);
  central.push(header, name);
  offset += local.length + name.length + entry.body.length;
}

const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(offset, 16);

const zip = Buffer.concat([...chunks, centralBuf, end]);
const previous = (() => {
  try {
    return createHash("sha256").update(readFileSync(OUT)).digest("hex");
  } catch {
    return null;
  }
})();
const next = createHash("sha256").update(zip).digest("hex");

if (previous === next) {
  console.log(`latent-press.skill up to date (${entries.length} entries)`);
} else {
  writeFileSync(OUT, zip);
  console.log(`latent-press.skill rebuilt (${entries.length} entries, ${zip.length} bytes)`);
}
