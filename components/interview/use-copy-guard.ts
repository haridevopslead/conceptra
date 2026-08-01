"use client";

import { useRef, useCallback } from "react";

// Anti-cheat paste-block exists to stop lifting a whole answer in from
// ChatGPT/notes/another tab — it was never meant to stop a candidate from
// reusing a variable/resource name they already typed a moment ago, which
// is normal when writing real code. Browsers don't expose where clipboard
// content came from, so this can't be a real security boundary: instead we
// track the exact text copied/cut from *this* answer box during the
// session and only let a paste through if it matches something in that
// history — anything else is still blocked exactly as before. A determined
// candidate could defeat this by typing the same text externally first;
// that's an accepted tradeoff for a heuristic that unblocks legitimate
// self-editing without reopening the door to pasting in outside answers.
const MAX_HISTORY = 50;

// window.getSelection() doesn't see text selected inside a <textarea>/<input>
// (those are form-control selections, not DOM selections), so try the
// selectionStart/End range first; CodeMirror's contenteditable surface has
// no .selectionStart, so it falls through to the real DOM selection.
function getSelectedText(e: React.ClipboardEvent): string {
  const target = e.target as HTMLTextAreaElement;
  if (typeof target?.selectionStart === "number" && typeof target?.selectionEnd === "number" && typeof target.value === "string") {
    const selected = target.value.slice(target.selectionStart, target.selectionEnd);
    if (selected) return selected;
  }
  return window.getSelection()?.toString() ?? "";
}

export function useCopyGuard() {
  const historyRef = useRef<Set<string>>(new Set());

  const trackCopy = useCallback((e: React.ClipboardEvent) => {
    const text = getSelectedText(e).trim();
    if (!text) return;
    historyRef.current.add(text);
    if (historyRef.current.size > MAX_HISTORY) {
      const oldest = historyRef.current.values().next().value;
      if (oldest !== undefined) historyRef.current.delete(oldest);
    }
  }, []);

  const isTrackedPaste = useCallback((pastedText: string) => {
    return historyRef.current.has(pastedText.trim());
  }, []);

  return { trackCopy, isTrackedPaste };
}
