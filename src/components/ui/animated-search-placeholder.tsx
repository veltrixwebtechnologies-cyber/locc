import { useEffect, useState } from "react";

type AnimatedSearchPlaceholderProps = {
  phrases: string[];
  active: boolean;
  className?: string;
};

export function AnimatedSearchPlaceholder({
  phrases,
  active,
  className = "",
}: AnimatedSearchPlaceholderProps) {
  const [index, setIndex] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!active || phrases.length === 0) return;

    const phrase = phrases[index] ?? "";
    const isComplete = characterCount === phrase.length;
    const isEmpty = characterCount === 0;
    const delay = isDeleting ? 42 : isComplete ? 1800 : 72;

    const timeout = window.setTimeout(() => {
      if (isComplete && !isDeleting) {
        setIsDeleting(true);
      } else if (isEmpty && isDeleting) {
        setIndex((current) => (current + 1) % phrases.length);
        setIsDeleting(false);
      } else {
        setCharacterCount((count) => count + (isDeleting ? -1 : 1));
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [active, characterCount, index, isDeleting, phrases]);

  useEffect(() => {
    if (active) return;
    setIndex(0);
    setCharacterCount(0);
    setIsDeleting(false);
  }, [active]);

  if (!active || phrases.length === 0) return null;

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-inherit ${className}`}
    >
      <span className="whitespace-nowrap">{(phrases[index] ?? "").slice(0, characterCount)}</span>
      <span className="ml-0.5 h-4 w-px animate-pulse bg-current" />
    </span>
  );
}
