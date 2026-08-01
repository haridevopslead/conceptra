import Evaluator from "@/components/interview/evaluator";

export const metadata = { title: "Quick Practice — Conceptra" };

export default function InterviewPracticePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Evaluator />
    </div>
  );
}
