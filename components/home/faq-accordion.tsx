"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type FAQ = { q: string; a: string };

export default function FaqAccordion({ items }: { items: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {items.map(({ q, a }, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={q} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 text-left"
              style={{ padding: "24px 26px", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, lineHeight: 1.35, color: "var(--foreground)", fontWeight: 500 }}>
                {q}
              </span>
              <Plus
                size={20}
                strokeWidth={2}
                className="shrink-0 transition-transform"
                style={{ color: "var(--muted)", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
              />
            </button>
            {isOpen && (
              <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--muted)", padding: "0 26px 24px" }}>{a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
