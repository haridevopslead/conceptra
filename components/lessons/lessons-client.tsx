"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LESSONS,
  CATEGORY_COLOR,
  DIFFICULTY_COLOR,
  type Category,
  type Lesson,
} from "@/lib/data/lessons";

const ALL_CATEGORIES = [
  "All",
  "Kubernetes",
  "CI/CD",
  "Cloud",
  "Infrastructure as Code",
  "Monitoring",
  "SRE",
] as const;

type Props = { plan: string; visitedSlugs: string[] };

function LockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

function LessonCard({ lesson, plan, visited }: { lesson: Lesson; plan: string; visited: boolean }) {
  const locked = !lesson.isFree && plan === "FREE";
  const categoryColor = CATEGORY_COLOR[lesson.category];
  const difficultyColor = DIFFICULTY_COLOR[lesson.difficulty];

  return (
    <div
      className="lesson-card relative flex flex-col rounded-xl border p-5 gap-4 transition-all duration-200"
      style={{
        backgroundColor: "#2C2420",
        borderColor: visited && !locked ? "rgba(156,174,134,0.35)" : "rgba(253,246,227,0.07)",
      }}
    >

      {/* Badges — top-right corner */}
      {locked && (
        <div
          className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: "#F5A623", color: "#1C1917" }}
        >
          <LockIcon />
          Pro
        </div>
      )}
      {visited && !locked && (
        <div
          className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: "rgba(156,174,134,0.18)", color: "#A7C48F", border: "1px solid rgba(156,174,134,0.45)" }}
        >
          ✓ Done
        </div>
      )}

      {/* Category + difficulty */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
        >
          {lesson.category}
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}
        >
          {lesson.difficulty}
        </span>
      </div>

      {/* Title + description */}
      <div className="flex-1">
        <h3 className="font-newsreader font-medium text-base leading-snug" style={{ color: locked ? "#8A8073" : "#FDF6E3", fontFamily: "'Newsreader', serif" }}>
          {lesson.title}
        </h3>
        <p className="text-sm mt-1.5 line-clamp-2" style={{ color: "#B3A799" }}>{lesson.description}</p>
      </div>

      {/* Topics */}
      <div className="flex flex-wrap gap-1.5">
        {lesson.topics.slice(0, 3).map((t) => (
          <span
            key={t}
            className="text-xs px-2 py-0.5 rounded"
            style={{ backgroundColor: "#211C18", border: "1px solid rgba(253,246,227,0.06)", color: "#8A8073" }}
          >
            {t}
          </span>
        ))}
        {lesson.topics.length > 3 && (
          <span className="text-xs self-center" style={{ color: "#6E665C" }}>
            +{lesson.topics.length - 3} more
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(253,246,227,0.06)" }}>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8A8073" }}>
          <ClockIcon />
          {lesson.durationMinutes} min
        </span>

        {locked ? (
          <Link
            href="/pricing"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#F5A623", color: "#1C1917" }}
          >
            Upgrade to unlock
          </Link>
        ) : (
          <Link
            href={`/lessons/${lesson.slug}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: "1px solid rgba(253,246,227,0.18)", color: "#FDF6E3" }}
          >
            {visited ? "Review →" : "Start lesson →"}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function LessonsClient({ plan, visitedSlugs }: Props) {
  const visitedSet = new Set(visitedSlugs);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return LESSONS.filter((l) => {
      const matchesCategory =
        activeCategory === "All" || l.category === activeCategory;
      const matchesSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.topics.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const countFor = (cat: string) =>
    cat === "All"
      ? LESSONS.length
      : LESSONS.filter((l) => l.category === cat).length;

  const freeCount = filtered.filter((l) => l.isFree).length;
  const proCount = filtered.filter((l) => !l.isFree).length;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#FDF6E3", fontFamily: "'Newsreader', serif", fontWeight: 500 }}>Lessons</h1>
        <p className="text-sm mt-1" style={{ color: "#B3A799" }}>
          {LESSONS.length} lessons across 6 DevOps domains
        </p>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search lessons, topics…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
          style={{ backgroundColor: "#2C2420", border: "1px solid rgba(253,246,227,0.08)", color: "#FDF6E3" }}
        />
      </div>

      {/* ── Category tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {ALL_CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          const color =
            cat === "All" ? "#F5A623" : CATEGORY_COLOR[cat as Category];
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border"
              style={
                active
                  ? { backgroundColor: `${color}20`, color, borderColor: color }
                  : {
                      backgroundColor: "transparent",
                      color: "#6B7280",
                      borderColor: "rgba(255,255,255,0.1)",
                    }
              }
            >
              {cat}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={
                  active
                    ? { backgroundColor: color, color: "#0A0E1A" }
                    : { backgroundColor: "#1F2937", color: "#6B7280" }
                }
              >
                {countFor(cat)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Results meta ── */}
      {filtered.length > 0 && (
        <p className="text-xs text-gray-500">
          Showing {filtered.length} lesson{filtered.length !== 1 ? "s" : ""}
          {plan === "FREE" && proCount > 0 && (
            <> &mdash; <span className="text-gray-400">{freeCount} free</span>, {proCount} require Pro</>
          )}
        </p>
      )}

      {/* ── Grid ── */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} plan={plan} visited={visitedSet.has(lesson.slug)} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-16 text-center"
          style={{ backgroundColor: "#2C2420", borderColor: "rgba(253,246,227,0.07)" }}
        >
          <svg
            className="w-10 h-10 text-gray-600 mb-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="text-sm font-medium text-gray-400">No lessons found</p>
          <p className="text-xs text-gray-600 mt-1">Try a different search or category</p>
          <button
            onClick={() => { setSearch(""); setActiveCategory("All"); }}
            className="mt-4 text-xs font-semibold hover:underline"
            style={{ color: "#F5A623" }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
