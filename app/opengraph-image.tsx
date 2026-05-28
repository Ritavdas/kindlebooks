import { ImageResponse } from "next/og";

export const alt =
  "KindleBeam — search, collect, and beam EPUBs to your Kindle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#07070b",
          backgroundImage:
            "radial-gradient(800px 800px at 8% -10%, rgba(155,107,255,0.55), transparent 60%), radial-gradient(750px 750px at 100% 0%, rgba(255,95,162,0.45), transparent 60%), radial-gradient(700px 700px at 60% 120%, rgba(95,208,255,0.35), transparent 60%)",
          color: "#f4f1ea",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 44,
              height: 44,
              borderRadius: 12,
              transform: "rotate(45deg)",
              background: "linear-gradient(135deg, #ffcf6b, #ff5fa2)",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            Kindle<span style={{ color: "#ff5fa2" }}>Beam</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Any book, beamed to your Kindle.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              color: "#9a93a8",
              maxWidth: 880,
            }}
          >
            Search millions of EPUBs, build your shelf, and send straight to
            your device in one tap.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 26,
            color: "#6a6478",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#5fd0ff",
            }}
          />
          your personal book beam
        </div>
      </div>
    ),
    { ...size }
  );
}
