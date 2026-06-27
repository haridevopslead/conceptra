"use client";

import { useEffect } from "react";

export default function LessonTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/lessons/${slug}/visit`, { method: "POST" }).catch(() => {});
  }, [slug]);
  return null;
}
