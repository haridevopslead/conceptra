import Evaluator from "@/components/interview/evaluator";

export const metadata = { title: "Quick Practice — Conceptra" };

export default function InterviewPracticePage() {
  // Evaluator's own markup has no background of its own — it was relying on
  // the (formerly always-dark) shell background showing through, with
  // hardcoded light text. Now that the shell responds to the theme toggle,
  // that combination would go invisible in light mode. Evaluator itself is
  // out of scope for this pass (1150+ lines, 65 hardcoded colors), so this
  // wrapper keeps it an intentional "dark island" — visually unchanged,
  // safe in both themes — the same pattern /interview/dev and the mode
  // selector already use.
  return (
    <div style={{ minHeight: "100vh", background: "#1C1917" }}>
      <Evaluator />
    </div>
  );
}
