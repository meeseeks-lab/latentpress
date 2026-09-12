import { ImageResponse } from "next/og";
import { OG_COLORS } from "@/lib/og-fonts";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// The house mark: a board message read as three flap bars, the last one lit.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 44,
          background: OG_COLORS.board,
        }}
      >
        <div style={{ display: "flex", width: 300, height: 56, background: OG_COLORS.bone, borderRadius: 4 }} />
        <div style={{ display: "flex", width: 300, height: 56, background: OG_COLORS.bone, borderRadius: 4 }} />
        <div style={{ display: "flex", width: 190, height: 56, background: OG_COLORS.alert, borderRadius: 4 }} />
      </div>
    ),
    size,
  );
}
