"use client";

import CodeMirror from "@uiw/react-codemirror";
import { StreamLanguage } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { EditorView } from "@codemirror/view";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";
import { useCopyGuard } from "./use-copy-guard";

// One shared theme extension, built once. Every color is a CSS custom
// property already wired to the app's light/dark toggle (app/globals.css),
// so the browser re-resolves them live on theme change — this extension
// never needs to be rebuilt or the editor remounted when the user switches
// themes.
const codeTheme = createTheme({
  theme: "dark",
  settings: {
    background: "var(--surface)",
    foreground: "var(--foreground)",
    caret: "var(--accent)",
    selection: "var(--hover-overlay)",
    selectionMatch: "var(--hover-overlay)",
    gutterBackground: "var(--surface)",
    gutterForeground: "var(--muted)",
    gutterBorder: "var(--border)",
    fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, monospace",
  },
  styles: [
    { tag: t.comment, color: "var(--muted)", fontStyle: "italic" },
    { tag: [t.string, t.special(t.string)], color: "#9CAE86" },
    { tag: [t.number, t.bool, t.null], color: "#D9A652" },
    { tag: [t.keyword, t.operatorKeyword], color: "var(--accent-text)" },
    { tag: t.variableName, color: "var(--foreground)" },
    { tag: t.propertyName, color: "#7B93B0" },
    { tag: t.invalid, color: "#EF4444" },
  ],
});

// Neither Terraform/HCL nor Kubernetes YAML has a dedicated legacy-mode
// package, so anything that isn't explicitly a Dockerfile falls back to the
// shell tokenizer — it still gets comments and quoted strings right, which
// is what "basic syntax highlighting" on a short interview answer needs.
// This is not meant to be a real per-language IDE experience.
function languageFor(questionText: string) {
  return /\bdockerfile\b/i.test(questionText) ? StreamLanguage.define(dockerFile) : StreamLanguage.define(shell);
}

export default function CodeAnswerInput({
  value,
  onChange,
  questionText,
  disabled,
  onPasteBlocked,
}: {
  value: string;
  onChange: (value: string) => void;
  questionText: string;
  disabled?: boolean;
  onPasteBlocked: () => void;
}) {
  const { trackCopy, isTrackedPaste } = useCopyGuard();

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      editable={!disabled}
      theme={codeTheme}
      indentWithTab
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false }}
      extensions={[languageFor(questionText), EditorView.lineWrapping]}
      placeholder="Write your code here…"
      minHeight="160px"
      maxHeight="360px"
      style={{ fontSize: 13, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}
      // Capture phase + stopPropagation so this runs before CodeMirror's own
      // internal paste handling ever sees the event — a bubble-phase
      // preventDefault (like the plain <textarea> boxes use) isn't reliable
      // here since CodeMirror intercepts paste itself rather than relying
      // purely on the browser's native contenteditable paste action.
      onCopyCapture={trackCopy}
      onCutCapture={trackCopy}
      onPasteCapture={(e) => {
        const pasted = e.clipboardData.getData("text/plain");
        if (isTrackedPaste(pasted)) return;
        e.preventDefault();
        e.stopPropagation();
        onPasteBlocked();
      }}
    />
  );
}
