export function scrollToShops() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const el = document.getElementById("shops-section");
      if (el) {
        const yOffset = -75; // Offset for fixed top navbar
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    }, 60);
  });
}
