"use client";

import { useState } from "react";
import Link from "next/link";
import Evaluator from "./evaluator";

type Mode = "select" | "practice";

export default function ModeSelector() {
  const [mode, setMode] = useState<Mode>("select");

  if (mode === "practice") return <Evaluator />;

  return (
    <div className="ms-wrap">
      <h1 className="ms-title">Interview Practice</h1>
      <p className="ms-sub">Choose how you want to practice today</p>

      <div className="ms-grid">
        {/* Quick Practice card */}
        <button onClick={() => setMode("practice")} className="ms-card">
          <div className="ms-card-icon">⚡</div>
          <h2 className="ms-card-title">Quick Practice</h2>
          <p className="ms-card-desc">
            Answer curated questions topic by topic. Get instant scored
            feedback after each answer with strengths, gaps, and the ideal
            senior-engineer response.
          </p>
          <span className="ms-card-cta">Start practicing →</span>
        </button>

        {/* Interview with Dev card */}
        <Link href="/interview/dev" className="ms-card ms-card-gold">
          <div className="ms-card-icon">🤖</div>
          <h2 className="ms-card-title">Interview with Dev</h2>
          <p className="ms-card-desc">
            Have a real back-and-forth conversation with Dev, a Senior DevOps
            Mentor. He&apos;ll probe your answers, follow up naturally, and give
            you honest holistic feedback.
          </p>
          <span className="ms-card-cta ms-card-cta-gold">Meet Dev →</span>
        </Link>
      </div>

      <style>{`
        .ms-wrap {
          min-height: 100vh; background: #1C1917; color: #E7DDD5;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 2rem 1rem;
        }
        .ms-title {
          font-size: 2rem; font-weight: 800; margin: 0 0 0.35rem;
          text-align: center;
        }
        .ms-sub {
          color: #9E8E85; margin: 0 0 2.5rem; text-align: center;
        }
        .ms-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1.25rem; width: 100%; max-width: 680px;
        }
        @media (max-width: 560px) {
          .ms-grid { grid-template-columns: 1fr; }
        }
        .ms-card {
          background: #23201E; border: 2px solid #2C2420;
          border-radius: 16px; padding: 1.75rem 1.5rem;
          text-align: left; cursor: pointer; transition: all 0.2s;
          display: flex; flex-direction: column; gap: 0.5rem;
          text-decoration: none; color: inherit;
        }
        .ms-card:hover {
          border-color: #4A403A; background: #272320;
          transform: translateY(-2px);
        }
        .ms-card-gold { border-color: #3D3018; }
        .ms-card-gold:hover { border-color: #F5A623; }
        .ms-card-icon { font-size: 2rem; }
        .ms-card-title {
          font-size: 1.15rem; font-weight: 700; margin: 0; color: #E7DDD5;
        }
        .ms-card-desc {
          font-size: 0.85rem; color: #9E8E85;
          line-height: 1.65; margin: 0; flex: 1;
        }
        .ms-card-cta {
          font-size: 0.85rem; font-weight: 600; color: #C9B8AE; margin-top: 0.5rem;
        }
        .ms-card-cta-gold { color: #F5A623; }
      `}</style>
    </div>
  );
}
