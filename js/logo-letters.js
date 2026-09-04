document.addEventListener("DOMContentLoaded", () => {
  // Same 4 stops as --logo-gradient in style.css (axis-x, accent-warm,
  // axis-y, axis-z), used to tint each letter's glow to match whatever
  // part of the gradient that letter sits on.
  const GRADIENT_STOPS = [
    { pos: 0,   rgb: [255, 46, 136] },  // --axis-x
    { pos: 1/3, rgb: [255, 210, 63] },  // --accent-warm
    { pos: 2/3, rgb: [57, 255, 158] },  // --axis-y
    { pos: 1,   rgb: [0, 229, 255] },   // --axis-z
  ];

  function interpolateColor(t) {
    t = Math.min(1, Math.max(0, t));
    for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
      const a = GRADIENT_STOPS[i];
      const b = GRADIENT_STOPS[i + 1];
      if (t >= a.pos && t <= b.pos) {
        const localT = (t - a.pos) / (b.pos - a.pos);
        return [
          Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * localT),
          Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * localT),
          Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * localT),
        ];
      }
    }
    return GRADIENT_STOPS[GRADIENT_STOPS.length - 1].rgb;
  }

  // Slices the shared gradient across each letter's span so it reads as
  // one continuous sweep across the word instead of repeating per-letter,
  // and gives each letter a resting soft shadow tinted to its own spot
  // on that same gradient.
  function layoutGradient(container) {
    const letters = container.querySelectorAll("span");
    const containerRect = container.getBoundingClientRect();
    const totalWidth = containerRect.width || 1;

    letters.forEach((span) => {
      const rect = span.getBoundingClientRect();
      const offset = rect.left - containerRect.left;
      span.style.backgroundSize = `${totalWidth}px 100%`;
      span.style.backgroundPosition = `-${offset}px 0`;

      const center = offset + rect.width / 2;
      const t = center / totalWidth;
      const [r, g, b] = interpolateColor(t);
      span.style.textShadow = `0 4px 14px rgba(${r}, ${g}, ${b}, 0.45)`;
    });
  }

  document.querySelectorAll(".logo").forEach((logo) => {
    const container = logo.querySelector(".logo-letters");
    if (!container) return;

    const letters = container.querySelectorAll("span");
    if (!letters.length) return;

    const MAX_LIFT = 12;   // Maximum lift in pixels
    const INFLUENCE = 55;  // Distance from cursor affected by the animation

    layoutGradient(container);

    let pendingX = null;
    let ticking = false;

    function applyLift(clientX) {
      const containerRect = container.getBoundingClientRect();
      const totalWidth = containerRect.width || 1;

      letters.forEach((span) => {
        const rect = span.getBoundingClientRect();
        const center = rect.left + rect.width / 2;

        const distance = Math.abs(clientX - center);

        // 1 when cursor is directly over the letter,
        // gradually falls to 0 at the edge of INFLUENCE.
        const strength = Math.max(0, 1 - distance / INFLUENCE);

        span.style.transform = `translateY(${-MAX_LIFT * strength}px)`;

        if (strength > 0) {
          // Where this letter sits along the gradient (0 = start, 1 = end),
          // so the glow color matches the letter's own gradient color.
          const t = (center - containerRect.left) / totalWidth;
          const [r, g, b] = interpolateColor(t);
          const blur = 12 * strength;
          const spread = 6 * strength;
          const alpha = 0.6 * strength;
          span.style.filter =
            `drop-shadow(0 ${spread}px ${blur}px rgba(${r}, ${g}, ${b}, ${alpha}))`;
        } else {
          span.style.filter = "none";
        }
      });
    }

    logo.addEventListener("mousemove", (e) => {
      pendingX = e.clientX;

      if (!ticking) {
        ticking = true;

        requestAnimationFrame(() => {
          applyLift(pendingX);
          ticking = false;
        });
      }
    });

    logo.addEventListener("mouseleave", () => {
      letters.forEach((span) => {
        span.style.transform = "translateY(0)";
        span.style.filter = "none";
      });
    });
  });

  // Re-slice the gradient if the layout changes (resize, or fonts loading
  // in late and shifting letter widths).
  function relayoutAll() {
    document.querySelectorAll(".logo .logo-letters").forEach(layoutGradient);
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayoutAll, 150);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(relayoutAll);
  }
});