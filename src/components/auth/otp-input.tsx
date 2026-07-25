import { useEffect, useRef } from "react";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
};

export function OtpInput({ value, onChange, disabled, autoFocus = true, "aria-label": ariaLabel }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, "").slice(0, 6).split("");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = (index: number, next: string) => {
    const clean = next.replace(/\D/g, "").slice(-1);
    const nextDigits = digits.slice();
    nextDigits[index] = clean;
    onChange(nextDigits.join(""));
    if (clean && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="grid grid-cols-6 gap-2" role="group" aria-label={ariaLabel ?? "Verification code"}>
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(element) => { refs.current[index] = element; }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digits[index] ?? ""}
          disabled={disabled}
          aria-label={`Verification digit ${index + 1}`}
          onChange={(event) => setDigit(index, event.target.value)}
          onPaste={handlePaste}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
            if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
            if (event.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
          }}
          className="h-12 w-full rounded-xl bg-card text-center font-mono text-xl outline-none ring-1 ring-black/[0.06] transition focus:ring-2 focus:ring-primary disabled:opacity-60"
        />
      ))}
    </div>
  );
}
