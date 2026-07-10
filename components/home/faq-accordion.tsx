"use client";

import { useState } from "react";

type FAQ = { q: string; a: string };

export default function FaqAccordion({ items }: { items: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {items.map(({ q, a }, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={q} style={{ background: "#2C2420", border: "1px solid rgba(253,246,227,0.07)", borderRadius: 18, overflow: "hidden" }}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 text-left"
              style={{ padding: "24px 26px", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, lineHeight: 1.35, color: "#FDF6E3", fontWeight: 500 }}>
                {q}
              </span>
              <span
                className="shrink-0 transition-transform"
                style={{ color: "#F5A623", fontSize: 20, fontWeight: 500, lineHeight: 1, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
              >
                +
              </span>
            </button>
            {isOpen && (
              <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#B3A799", padding: "0 26px 24px" }}>{a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
