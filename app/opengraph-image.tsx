import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Conceptra — Ace Your DevOps Interview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          backgroundColor: "#1C1917",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Top brand label */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#F5A623",
            }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#6E665C",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "serif",
            }}
          >
            Conceptra
          </span>
        </div>

        {/* Main heading */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 600,
            color: "#F5A623",
            fontFamily: "Georgia, serif",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 28,
          }}
        >
          Ace Your DevOps Interview
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#B3A799",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: 860,
          }}
        >
          AI-powered coaching by a Lead DevOps Engineer.
          <br />
          Real scenarios · Honest feedback · Land the role.
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          {["Docker", "Kubernetes", "CI/CD", "AWS", "Terraform"].map((tag) => (
            <div
              key={tag}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#3A322C",
                letterSpacing: "0.08em",
                fontFamily: "monospace",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
