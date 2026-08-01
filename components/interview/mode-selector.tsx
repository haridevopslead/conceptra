"use client";

import Link from "next/link";
import { Zap, Mic2 } from "lucide-react";

export default function ModeSelector() {
  return (
    <div className="ms-wrap">
      <h1 className="ms-title">Interview Practice</h1>
      <p className="ms-sub">Choose how you want to practice today</p>

      <div className="ms-grid">
        {/* Quick Practice card */}
        <Link href="/interview/practice" className="ms-card">
          <div className="ms-card-icon">
            <Zap size={28} strokeWidth={2} />
          </div>
          <h2 className="ms-card-title">Quick Practice</h2>
          <p className="ms-card-desc">
            Answer curated questions topic by topic. Get instant scored
            feedback after each answer with strengths, gaps, and the ideal
            senior-engineer response.
          </p>
          <span className="ms-card-cta">Start practicing →</span>
        </Link>

        {/* Interview with Hari card */}
        <Link href="/interview/dev" className="ms-card ms-card-gold">
          <div className="ms-card-icon ms-card-icon-gold">
            <Mic2 size={28} strokeWidth={2} />
          </div>
          <h2 className="ms-card-title">Interview with Hari</h2>
          <p className="ms-card-desc">
            Have a real back-and-forth conversation with Hari — an AI mentor
            trained on a real Lead DevOps Engineer&apos;s interview experience.
            Pick a topic, or paste a real job posting for questions tailored
            to that exact role, and he&apos;ll give you honest holistic
            feedback.
          </p>
          <span className="ms-card-cta ms-card-cta-gold">Meet Hari →</span>
        </Link>
      </div>

      <style>{`
        .ms-wrap {
          min-height: 100vh; background: var(--background); color: var(--foreground);
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 2rem 1rem;
        }
        .ms-title {
          font-size: 2rem; font-weight: 800; margin: 0 0 0.35rem;
          text-align: center;
        }
        .ms-sub {
          color: var(--muted); margin: 0 0 2.5rem; text-align: center;
        }
        .ms-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1.25rem; width: 100%; max-width: 680px;
        }
        @media (max-width: 560px) {
          .ms-grid { grid-template-columns: 1fr; }
        }
        .ms-card {
          background: var(--surface); border: 2px solid var(--surface-2);
          border-radius: 16px; padding: 1.75rem 1.5rem;
          text-align: left; cursor: pointer; transition: all 0.2s;
          display: flex; flex-direction: column; gap: 0.5rem;
          text-decoration: none; color: inherit;
        }
        .ms-card:hover {
          border-color: var(--muted); background: var(--surface-2);
          transform: translateY(-2px);
        }
        .ms-card-gold { border-color: rgba(245,166,35,0.25); }
        .ms-card-gold:hover { border-color: #F5A623; }
        .ms-card-icon { color: var(--muted); }
        .ms-card-icon-gold { color: var(--accent-text); }
        .ms-card-title {
          font-size: 1.15rem; font-weight: 700; margin: 0; color: var(--foreground);
        }
        .ms-card-desc {
          font-size: 0.85rem; color: var(--muted);
          line-height: 1.65; margin: 0; flex: 1;
        }
        .ms-card-cta {
          font-size: 0.85rem; font-weight: 600; color: var(--muted); margin-top: 0.5rem;
        }
        .ms-card-cta-gold { color: var(--accent-text); }
      `}</style>
    </div>
  );
}
