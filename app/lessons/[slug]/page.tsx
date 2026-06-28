import { LESSONS, CATEGORY_COLOR, DIFFICULTY_COLOR } from "@/lib/data/lessons";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import LessonTracker from "@/components/lessons/lesson-tracker";

export async function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

type Layer = {
  type: string;
  title: string;
  content: string;
};

// ─── Layer config ────────────────────────────────────────────────────────────

const LAYER_CONFIG: Record<string, { color: string; label: string }> = {
  story:         { color: "#F5A623", label: "THE STORY" },
  concept:       { color: "#3B82F6", label: "THE CONCEPT" },
  pressure_test: { color: "#EF4444", label: "PRESSURE TEST" },
};

// ─── Story renderer ──────────────────────────────────────────────────────────

function StoryContent({ content }: { content: string }) {
  return (
    <div className="space-y-4">
      {content.split("\n\n").filter(Boolean).map((para, i) => (
        <p key={i} className="text-sm text-gray-300 leading-7">{para}</p>
      ))}
    </div>
  );
}

// ─── Concept renderer ────────────────────────────────────────────────────────

const DOCKERFILE_KW = /^(FROM|RUN|COPY|CMD|WORKDIR|EXPOSE|ENV|ARG|ENTRYPOINT|USER|VOLUME|LABEL)\b/;

function isCodePara(chunk: string) {
  return chunk.split("\n").some((l) => DOCKERFILE_KW.test(l));
}

function isSectionHeader(chunk: string) {
  return !chunk.includes("\n") && chunk.trimEnd().endsWith(":");
}

type ConceptChunk = { kind: "code" | "header" | "text"; text: string };

function buildConceptChunks(content: string): ConceptChunk[] {
  const out: ConceptChunk[] = [];
  for (const raw of content.split("\n\n").filter(Boolean)) {
    if (isCodePara(raw)) {
      const prev = out[out.length - 1];
      if (prev?.kind === "code") {
        prev.text += "\n\n" + raw;  // merge consecutive code blocks
      } else {
        out.push({ kind: "code", text: raw });
      }
    } else if (isSectionHeader(raw)) {
      out.push({ kind: "header", text: raw });
    } else {
      out.push({ kind: "text", text: raw });
    }
  }
  return out;
}

function CodeBlock({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <pre
      className="text-xs font-mono p-4 rounded-xl overflow-x-auto leading-6 border border-white/5"
      style={{ backgroundColor: "#0D1117" }}
    >
      {lines.map((line, i) => (
        <span key={i}>
          <span style={{ color: line.startsWith("#") ? "#6B7280" : "#86EFAC" }}>
            {line}
          </span>
          {i < lines.length - 1 && "\n"}
        </span>
      ))}
    </pre>
  );
}

function ConceptContent({ content }: { content: string }) {
  const chunks = buildConceptChunks(content);
  return (
    <div className="space-y-4">
      {chunks.map((chunk, i) => {
        if (chunk.kind === "code") return <CodeBlock key={i} code={chunk.text} />;
        if (chunk.kind === "header") {
          return (
            <p key={i} className="text-sm font-bold text-white pt-2">
              {chunk.text}
            </p>
          );
        }
        return (
          <p key={i} className="text-sm text-gray-300 leading-7">
            {chunk.text}
          </p>
        );
      })}
    </div>
  );
}

// ─── Pressure test renderer ──────────────────────────────────────────────────

function PTBox({
  color,
  bg,
  border,
  icon,
  label,
  body,
}: {
  color: string;
  bg: string;
  border: string;
  icon: string;
  label: string;
  body: string;
}) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <p className="text-xs font-bold mb-2" style={{ color }}>
        {icon} {label}
      </p>
      <p className="text-sm text-gray-300 leading-6">{body}</p>
    </div>
  );
}

function PressureTestContent({ content }: { content: string }) {
  const chunks = content.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-4">
      {chunks.map((chunk, i) => {
        if (chunk === "---") {
          return <hr key={i} className="border-white/10 my-2" />;
        }

        if (chunk.startsWith("QUESTION")) {
          const colon = chunk.indexOf(":");
          const qLabel = chunk.slice(0, colon);
          const qText  = chunk.slice(colon + 1).trim();
          return (
            <div key={i} className="pt-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {qLabel}
              </span>
              <p className="text-base font-bold text-white mt-1">{qText}</p>
            </div>
          );
        }

        if (chunk.startsWith("WEAK")) {
          const colon = chunk.indexOf(":");
          return (
            <PTBox
              key={i}
              color="#EF4444"
              bg="rgba(239,68,68,0.07)"
              border="rgba(239,68,68,0.2)"
              icon="⚠"
              label={chunk.slice(0, colon)}
              body={chunk.slice(colon + 1).trim()}
            />
          );
        }

        if (chunk.startsWith("STRONG")) {
          const colon = chunk.indexOf(":");
          return (
            <PTBox
              key={i}
              color="#10B981"
              bg="rgba(16,185,129,0.07)"
              border="rgba(16,185,129,0.2)"
              icon="✓"
              label={chunk.slice(0, colon)}
              body={chunk.slice(colon + 1).trim()}
            />
          );
        }

        if (chunk.startsWith("SENIOR INSIGHT")) {
          return (
            <PTBox
              key={i}
              color="#F5A623"
              bg="rgba(245,166,35,0.07)"
              border="rgba(245,166,35,0.2)"
              icon="⚡"
              label="SENIOR INSIGHT"
              body={chunk.replace(/^SENIOR INSIGHT:\s*/, "")}
            />
          );
        }

        if (chunk.startsWith("FOLLOW-UP")) {
          const bullets = chunk.split("\n").filter((l) => l.startsWith("- "));
          return (
            <div key={i} className="pt-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                Follow-Up Probes
              </p>
              <ul className="space-y-2">
                {bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="shrink-0 mt-0.5" style={{ color: "#EF4444" }}>›</span>
                    <span>{b.replace(/^-\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <p key={i} className="text-sm text-gray-400 leading-7">{chunk}</p>
        );
      })}
    </div>
  );
}

// ─── Layer dispatcher ────────────────────────────────────────────────────────

function LayerContent({ layer }: { layer: Layer }) {
  switch (layer.type) {
    case "story":         return <StoryContent content={layer.content} />;
    case "concept":       return <ConceptContent content={layer.content} />;
    case "pressure_test": return <PressureTestContent content={layer.content} />;
    default:              return <p className="text-sm text-gray-300 leading-7 whitespace-pre-line">{layer.content}</p>;
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LessonDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const lesson = LESSONS.find((l) => l.slug === params.slug);
  if (!lesson) notFound();

  const dbLesson = await db.lesson.findUnique({ where: { slug: params.slug } });
  const layers: Layer[] =
    (dbLesson?.content as { layers?: Layer[] } | null)?.layers ?? [];

  const categoryColor  = CATEGORY_COLOR[lesson.category];
  const difficultyColor = DIFFICULTY_COLOR[lesson.difficulty];

  return (
    <div className="lesson-detail-page p-4 sm:p-8 w-full max-w-[860px]">
      <LessonTracker slug={params.slug} />
      {/* Back */}
      <Link
        href="/lessons"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Lessons
      </Link>

      {/* Header card */}
      <div
        className="lesson-header-card rounded-2xl border border-white/10 p-5 sm:p-8 space-y-4 mb-6"
        style={{ backgroundColor: "#111827" }}
      >
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
          <span className="text-xs text-gray-500 ml-auto">{lesson.durationMinutes} min</span>
        </div>

        <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>
        <p className="text-gray-400">{lesson.description}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          {lesson.topics.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-1 rounded border border-white/10 text-gray-400"
              style={{ backgroundColor: "#1F2937" }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Content layers */}
      {layers.length > 0 ? (
        <div className="space-y-5">
          {layers.map((layer, i) => {
            const cfg = LAYER_CONFIG[layer.type] ?? { color: "#6B7280", label: layer.type.toUpperCase() };
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/10 p-6 space-y-4"
                style={{ backgroundColor: "#111827", borderLeft: `3px solid ${cfg.color}` }}
              >
                <div>
                  <p className="text-xs font-bold tracking-widest" style={{ color: cfg.color }}>
                    {cfg.label}
                  </p>
                  <h2 className="text-lg font-bold text-white mt-1">{layer.title}</h2>
                </div>
                <LayerContent layer={layer} />
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="rounded-2xl border border-white/10 flex flex-col items-center justify-center py-20 text-center"
          style={{ backgroundColor: "#111827" }}
        >
          <svg
            className="w-10 h-10 text-gray-600 mb-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path d="M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664z" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <p className="text-sm font-medium text-gray-400">Lesson content coming soon</p>
          <p className="text-xs text-gray-600 mt-1">
            Full AI-guided lesson content will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
