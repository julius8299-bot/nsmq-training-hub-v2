import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "512px",
          height: "512px",
          borderRadius: "110px",
          background: "linear-gradient(135deg, #0b2f24 0%, #07856f 55%, #f5b21a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "34px",
            border: "14px solid rgba(255,255,255,0.28)",
            borderRadius: "86px",
          }}
        />
        <div
          style={{
            width: "340px",
            height: "340px",
            borderRadius: "80px",
            background: "rgba(255,255,255,0.94)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 28px 70px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              color: "#0b2f24",
              fontSize: "72px",
              fontWeight: 900,
              letterSpacing: "-4px",
              lineHeight: 1,
            }}
          >
            G
          </div>
          <div
            style={{
              color: "#07856f",
              fontSize: "58px",
              fontWeight: 900,
              letterSpacing: "-3px",
              lineHeight: 1,
              marginTop: "8px",
            }}
          >
            NSMQ
          </div>
          <div
            style={{
              color: "#9a6400",
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "4px",
              marginTop: "18px",
            }}
          >
            HUB
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
