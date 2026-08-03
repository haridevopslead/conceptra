"use client";

import Link from "next/link";
import { Zap, Mic2 } from "lucide-react";

export default function ModeSelector() {
  return (
    <div className="ms-wrap">
      <div className="ms-header">
        <p className="ms-eyebrow">Practice</p>
        <h1 className="ms-title">Interview Practice</h1>
        <p className="ms-sub">Choose how you want to practice today</p>
      </div>

      <div className="ms-grid">
        {/* Quick Practice card */}
        <Link href="/interview/practice" className="ms-card">
          <div className="ms-card-icon">
            <Zap size={22} strokeWidth={2} />
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
            <Mic2 size={22} strokeWidth={2} />
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
          min-height: 100%; background: var(--background); color: var(--foreground);
          padding: 56px 64px 80px;
        }
        .ms-header { margin-bottom: 36px; }
        .ms-eyebrow {
          font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--muted); font-weight: 600; margin: 0 0 10px;
        }
        .ms-title {
          font-family: 'Newsreader', serif; font-size: 30px; font-weight: 500;
          letter-spacing: -0.01em; margin: 0;
        }
        .ms-sub {
          color: var(--muted); margin: 8px 0 0; font-size: 15px;
        }
        .ms-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1.25rem; width: 100%; max-width: 780px;
        }
        @media (max-width: 767px) {
          .ms-wrap { padding: 32px 20px 60px; }
          .ms-grid { grid-template-columns: 1fr; }
        }
        .ms-card {
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 18px; padding: 26px 24px;
          text-align: left; cursor: pointer; transition: all 0.2s;
          display: flex; flex-direction: column; gap: 0.65rem;
          text-decoration: none; color: inherit;
        }
        .ms-card:hover {
          border-color: var(--muted);
          transform: translateY(-2px);
        }
        .ms-card-gold { border-color: rgba(245,166,35,0.3); }
        .ms-card-gold:hover { border-color: var(--accent); }
        .ms-card-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface); color: var(--muted); margin-bottom: 0.25rem;
        }
        .ms-card-icon-gold { background: rgba(245,166,35,0.12); color: var(--accent-text); }
        .ms-card-title {
          font-family: 'Newsreader', serif; font-size: 1.2rem; font-weight: 500; margin: 0; color: var(--foreground);
        }
        .ms-card-desc {
          font-size: 0.85rem; color: var(--muted);
          line-height: 1.65; margin: 0; flex: 1;
        }
        .ms-card-cta {
          font-size: 0.85rem; font-weight: 600; color: var(--foreground); margin-top: 0.5rem;
        }
        .ms-card-cta-gold { color: var(--accent-text); }
      `}</style>
    </div>
  );
}
