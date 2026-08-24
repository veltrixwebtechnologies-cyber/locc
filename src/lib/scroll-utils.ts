export function scrollToShops() {
  // Dual rAF + setTimeout ensures React has finished state updates & DOM layout rendering
  requestAnimationFrame(() => {
    setTimeout(() => {
      const el = document.getElementById("shops-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  });
}
