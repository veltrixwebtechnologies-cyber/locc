export function flyProductToCart(productId: string) {
  if (
    typeof window === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const source = document.querySelector<HTMLElement>(
    `[data-product-id="${CSS.escape(productId)}"] [data-product-image]`,
  );
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!source || !target) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const clone = source.cloneNode(true) as HTMLElement;
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    position: "fixed",
    zIndex: "100",
    pointerEvents: "none",
    margin: "0",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 12px 35px rgba(42, 27, 74, 0.22)",
  });
  document.body.appendChild(clone);

  const deltaX = to.left + to.width / 2 - (from.left + from.width / 2);
  const deltaY = to.top + to.height / 2 - (from.top + from.height / 2);
  clone
    .animate(
      [
        { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
        {
          transform: `translate3d(${deltaX * 0.55}px,${deltaY * 0.35 - 42}px,0) scale(.72)`,
          opacity: 0.92,
          offset: 0.55,
        },
        { transform: `translate3d(${deltaX}px,${deltaY}px,0) scale(.16)`, opacity: 0.15 },
      ],
      { duration: 620, easing: "cubic-bezier(.22,1,.36,1)" },
    )
    .finished.finally(() => clone.remove());

  target.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.16)", offset: 0.72 },
      { transform: "scale(1)" },
    ],
    { duration: 680, easing: "cubic-bezier(.22,1,.36,1)" },
  );
}
