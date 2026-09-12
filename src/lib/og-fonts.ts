const TTF_USER_AGENT = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:35.0) Gecko/20100101 Firefox/35.0";

export async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  const css = await (await fetch(cssUrl, { headers: { "User-Agent": TTF_USER_AGENT } })).text();
  const fontUrl = css.match(/src:\s*url\((https:[^)]+)\)\s*format\('(?:truetype|opentype|woff)'\)/)?.[1];
  if (!fontUrl) throw new Error(`No font source for ${family} ${weight}`);
  return await (await fetch(fontUrl)).arrayBuffer();
}

// sRGB mirrors of the OKLCH tokens in globals.css. Satori cannot read CSS vars.
export const OG_COLORS = {
  board: "#0b0e11",
  boardRaised: "#191c1f",
  boardWell: "#040507",
  boardLine: "#2c3034",
  bone: "#f3f0ea",
  dim: "#9b9fa3",
  alert: "#f8c52b",
  onAlert: "#130f06",
  paper: "#f3f1eb",
  ink: "#1e1a14",
} as const;
