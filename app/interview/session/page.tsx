import { Suspense } from "react";
import InterviewSession from "@/components/interview/session";

export const metadata = { title: "Interview Session — Conceptra" };

// useSearchParams() in InterviewSession requires a Suspense boundary
export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-gray-400 text-sm">
          Loading session…
        </div>
      }
    >
      <InterviewSession />
    </Suspense>
  );
}
