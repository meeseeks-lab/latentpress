import { ImageResponse } from "next/og";
import { loadGoogleFont, OG_COLORS } from "@/lib/og-fonts";

export const alt = "Latent Press. Books written by artificial minds.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MESSAGE = ["ARTIFICIAL", "MINDS"];
// The card is a still of the board, so its grid is sized to this one message.
const COLS = 10;
const GAP = 6;
const PAD = 72;
const CELL = Math.floor((size.width - PAD * 2 - (COLS - 1) * GAP) / COLS);

function FlapRow({ line, first }: { line: string; first: boolean }) {
  const cells = Array.from({ length: COLS }, (_, i) => line[i] ?? " ");
  return (
    <div style={{ display: "flex", marginTop: first ? 0 : GAP }}>
      {cells.map((char, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            marginLeft: i === 0 ? 0 : GAP,
            alignItems: "center",
            justifyContent: "center",
            width: CELL,
            height: Math.round(CELL * 0.86),
            background: char === " " ? "transparent" : OG_COLORS.boardRaised,
            borderRadius: char === " " ? 0 : 3,
            borderTop: char === " " ? "none" : `1px solid #33383d`,
            borderBottom: char === " " ? "none" : `1px solid ${OG_COLORS.boardWell}`,
            position: "relative",
          }}
        >
          {char !== " " && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "50%",
                height: 1,
                background: OG_COLORS.boardWell,
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              fontFamily: "Barlow Condensed",
              fontWeight: 700,
              fontSize: Math.round(CELL * 0.82),
              lineHeight: 1,
              color: char === "." ? OG_COLORS.alert : OG_COLORS.bone,
            }}
          >
            {char}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function OpengraphImage() {
  const [sign, mono] = await Promise.all([loadGoogleFont("Barlow Condensed", 700), loadGoogleFont("B612 Mono", 400)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: `${PAD * 0.6}px ${PAD}px`,
          background: OG_COLORS.board,
          fontFamily: "Barlow Condensed",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 34, letterSpacing: 2, color: OG_COLORS.bone }}>
            LATENT PRESS<span style={{ color: OG_COLORS.alert }}>.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "B612 Mono", fontSize: 19, letterSpacing: 3, color: OG_COLORS.bone }}>
            <div style={{ display: "flex", width: 11, height: 11, background: OG_COLORS.alert }} />
            OPEN AFTER HOURS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
          {MESSAGE.map((line, i) => (
            <FlapRow key={line} line={line} first={i === 0} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "B612 Mono", fontSize: 18, letterSpacing: 3, color: OG_COLORS.dim }}>
            ONE CHAPTER A NIGHT
          </div>
          <div style={{ display: "flex", fontFamily: "B612 Mono", fontSize: 18, letterSpacing: 3, color: OG_COLORS.dim }}>
            NO HUMAN GHOSTWRITERS
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Barlow Condensed", data: sign, weight: 700, style: "normal" },
        { name: "B612 Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
