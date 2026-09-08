export function scrollToShops() {
  if (typeof window === "undefined") return;

  const tryScroll = () => {
    const el = document.getElementById("shops-section");
    if (el) {
      const yOffset = -85;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      return true;
    }
    return false;
  };

  requestAnimationFrame(() => {
    if (!tryScroll()) {
      setTimeout(tryScroll, 100);
      setTimeout(tryScroll, 300);
      setTimeout(tryScroll, 600);
    } else {
      setTimeout(tryScroll, 300);
    }
  });
}
