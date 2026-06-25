import { LESSONS } from "@/lib/data/lessons";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORY_COLOR, DIFFICULTY_COLOR } from "@/lib/data/lessons";

export async function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export default function LessonDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const lesson = LESSONS.find((l) => l.slug === params.slug);
  if (!lesson) notFound();

  const categoryColor = CATEGORY_COLOR[lesson.category];
  const difficultyColor = DIFFICULTY_COLOR[lesson.difficulty];

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/lessons"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Lessons
      </Link>

      {/* Header card */}
      <div
        className="rounded-2xl border border-white/10 p-8 space-y-4"
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
          <span className="text-xs text-gray-500 ml-auto">
            {lesson.durationMinutes} min
          </span>
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

      {/* Placeholder content area */}
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
    </div>
  );
}
