document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const hasFinePointer = window.matchMedia(
    "(pointer: fine)"
  ).matches;

  // Skip entirely on touch devices and when the user has asked for less motion.
  if (prefersReducedMotion || !hasFinePointer) return;

  // ==================================================
  // COLOUR HELPERS
  // ==================================================

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");

    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }

  const rootStyles = getComputedStyle(
    document.documentElement
  );

  const GLOW_COLOR = rootStyles
    .getPropertyValue("--axis-z")
    .trim();

  // ==================================================
  // COLOUR INTERPOLATION — full rainbow (HSL hue sweep)
  // ==================================================
  // Instead of blending between a handful of named brand stops, this
  // sweeps continuously through the entire hue circle. Hue wraps at
  // 360° back to 0° by definition, so the loop is seamless with no
  // wraparound fix needed — there's nothing to "snap".
  //
  // Saturation/lightness are fixed so every hue reads at a consistent
  // neon brightness against the near-black background, instead of
  // some hues (like yellow) looking washed out relative to others.
  const RAINBOW_SATURATION = 0.9;
  const RAINBOW_LIGHTNESS = 0.6;

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  function interpolateColor(t) {
    t = ((t % 1) + 1) % 1;
    const hue = t * 360;
    return hslToRgb(hue, RAINBOW_SATURATION, RAINBOW_LIGHTNESS);
  }

  // ==================================================
  // TRAIL SETTINGS
  // ==================================================

  const LIFETIME_MS = 450;

  // Distance between particles.
  // This controls particle density, NOT curve smoothness.
  const SPACING_PX = 2.5;

  const BASE_RADIUS = 3.5;

  const MAX_GLOW = 1;

  // How long (ms) one full sweep through the color stops takes.
  // Color now advances on a clock, not per-particle, so a fast
  // flick of the mouse can't make the hue jump — it always
  // shifts at this same steady rate regardless of mouse speed.
  // (Replaces the old CYCLE_LENGTH, which counted particles —
  // that meant a fast flick spawned a burst of particles in a
  // single mousemove event and the color jumped several stops
  // almost instantly, which is what read as "snappy".)
  const CYCLE_DURATION_MS = 4000;

  const SMOOTHING = 0.35;

  // 50% maximum opacity
  const MAX_ALPHA = 0.75;

  // ==================================================
  // CURVE SETTINGS
  // ==================================================

  // How many interpolation steps are used to build
  // the curved mouse path.
  //
  // Higher = smoother curve.
  const CURVE_STEPS = 20;

  // ==================================================
  // CANVAS
  // ==================================================

  const canvas = document.createElement("canvas");

  canvas.className =
    "mouse-trail-canvas";

  document.body.appendChild(canvas);

  const ctx =
    canvas.getContext("2d");

  let cssWidth =
    window.innerWidth;

  let cssHeight =
    window.innerHeight;

  function resizeCanvas() {
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    cssWidth =
      window.innerWidth;

    cssHeight =
      window.innerHeight;

    canvas.width =
      cssWidth * dpr;

    canvas.height =
      cssHeight * dpr;

    canvas.style.width =
      `${cssWidth}px`;

    canvas.style.height =
      `${cssHeight}px`;

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );
  }

  resizeCanvas();

  let resizeTimer = null;

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);

      resizeTimer =
        setTimeout(
          resizeCanvas,
          150
        );
    }
  );

  // ==================================================
  // PARTICLE STATE
  // ==================================================

  const particles = [];

  // Recent mouse positions.
  //
  // These are the control points used to construct
  // the smooth curve.
  const mousePath = [];

  let smoothedX = null;
  let smoothedY = null;

  let rafRunning = false;

  // Used to preserve exact particle spacing
  // along the curved path.
  let distanceAccumulator = 0;

  // ==================================================
  // PARTICLE CREATION
  // ==================================================

  function spawnParticle(x, y) {
    const now = performance.now();

    // Color progresses on a fixed clock rather than per-particle,
    // so it always sweeps at the same steady rate — moving the
    // mouse fast just spawns more particles along the same short
    // stretch of the gradient, instead of racing through more of it.
    const t =
      (now % CYCLE_DURATION_MS) /
      CYCLE_DURATION_MS;

    const color =
      interpolateColor(t);

    particles.push({
      x,
      y,
      spawnTime: now,
      color,
    });
  }

  // ==================================================
  // CATMULL-ROM CURVE
  // ==================================================

  function catmullRom(
    p0,
    p1,
    p2,
    p3,
    t
  ) {
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x:
        0.5 *
        (
          2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x -
            5 * p1.x +
            4 * p2.x -
            p3.x) * t2 +
          (-p0.x +
            3 * p1.x -
            3 * p2.x +
            p3.x) * t3
        ),

      y:
        0.5 *
        (
          2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y -
            5 * p1.y +
            4 * p2.y -
            p3.y) * t2 +
          (-p0.y +
            3 * p1.y -
            3 * p2.y +
            p3.y) * t3
        ),
    };
  }

  // ==================================================
  // ADD CURVED SECTION
  // ==================================================

  function addCurvedSection(
    p0,
    p1,
    p2,
    p3
  ) {
    let previousPoint = {
      x: p1.x,
      y: p1.y,
    };

    for (
      let i = 1;
      i <= CURVE_STEPS;
      i++
    ) {
      const t =
        i / CURVE_STEPS;

      const currentPoint =
        catmullRom(
          p0,
          p1,
          p2,
          p3,
          t
        );

      const dx =
        currentPoint.x -
        previousPoint.x;

      const dy =
        currentPoint.y -
        previousPoint.y;

      const segmentDistance =
        Math.hypot(dx, dy);

      if (segmentDistance > 0) {
        distanceAccumulator +=
          segmentDistance;

        while (
          distanceAccumulator >=
          SPACING_PX
        ) {
          const ratio =
            (
              SPACING_PX -
              (
                distanceAccumulator -
                segmentDistance
              )
            ) /
            segmentDistance;

          const spawnX =
            previousPoint.x +
            dx * ratio;

          const spawnY =
            previousPoint.y +
            dy * ratio;

          spawnParticle(
            spawnX,
            spawnY
          );

          distanceAccumulator -=
            SPACING_PX;
        }
      }

      previousPoint =
        currentPoint;
    }
  }

  // ==================================================
  // MOUSE TRACKING
  // ==================================================

  window.addEventListener(
    "mousemove",
    (e) => {

      // ----------------------------------------------
      // First mouse position
      // ----------------------------------------------

      if (smoothedX === null) {
        smoothedX =
          e.clientX;

        smoothedY =
          e.clientY;

        mousePath.push({
          x: smoothedX,
          y: smoothedY,
        });

        spawnParticle(
          smoothedX,
          smoothedY
        );

      } else {

        // --------------------------------------------
        // Smooth mouse movement
        // --------------------------------------------

        smoothedX +=
          (
            e.clientX -
            smoothedX
          ) *
          (1 - SMOOTHING);

        smoothedY +=
          (
            e.clientY -
            smoothedY
          ) *
          (1 - SMOOTHING);

        const newPoint = {
          x: smoothedX,
          y: smoothedY,
        };

        mousePath.push(
          newPoint
        );

        // --------------------------------------------
        // Once we have enough points, construct
        // a curved section.
        //
        // p0 ---- p1 ---- p2 ---- p3
        //
        //           ╲
        //             curved
        //               section
        // --------------------------------------------

        if (
          mousePath.length >= 4
        ) {
          const length =
            mousePath.length;

          const p0 =
            mousePath[length - 4];

          const p1 =
            mousePath[length - 3];

          const p2 =
            mousePath[length - 2];

          const p3 =
            mousePath[length - 1];

          addCurvedSection(
            p0,
            p1,
            p2,
            p3
          );

          // Keep only the recent points
          // needed for the spline.
          if (
            mousePath.length > 4
          ) {
            mousePath.shift();
          }
        }
      }

      if (!rafRunning) {
        rafRunning = true;

        requestAnimationFrame(
          draw
        );
      }
    }
  );

  // ==================================================
  // DRAW PARTICLES
  // ==================================================

  function draw() {
    const now =
      performance.now();

    ctx.clearRect(
      0,
      0,
      cssWidth,
      cssHeight
    );

    for (
      let i =
        particles.length - 1;
      i >= 0;
      i--
    ) {

      const p =
        particles[i];

      const age =
        now -
        p.spawnTime;

      // Remove expired particles
      if (
        age >=
        LIFETIME_MS
      ) {
        particles.splice(
          i,
          1
        );

        continue;
      }

      const ageFactor =
        age /
        LIFETIME_MS;

      const fade =
        1 - ageFactor;

      // Particle size
      const radius =
        BASE_RADIUS *
        (
          0.35 +
          0.65 * fade
        );

      // Maximum opacity = 50%
      const alpha =
        MAX_ALPHA *
        fade;

      // ----------------------------------------------
      // Soft radial particle
      // ----------------------------------------------

      const gradient =
        ctx.createRadialGradient(
          p.x,
          p.y,
          0,

          p.x,
          p.y,
          radius
        );

      gradient.addColorStop(
        0,
        `rgba(
          ${p.color.r},
          ${p.color.g},
          ${p.color.b},
          ${alpha}
        )`
      );

      gradient.addColorStop(
        0.35,
        `rgba(
          ${p.color.r},
          ${p.color.g},
          ${p.color.b},
          ${alpha * 0.65}
        )`
      );

      gradient.addColorStop(
        1,
        `rgba(
          ${p.color.r},
          ${p.color.g},
          ${p.color.b},
          0
        )`
      );

      ctx.fillStyle =
        gradient;

      ctx.shadowColor =
        GLOW_COLOR;

      ctx.shadowBlur =
        MAX_GLOW * fade;

      ctx.beginPath();

      ctx.arc(
        p.x,
        p.y,
        radius,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (
      particles.length === 0
    ) {
      rafRunning = false;
      return;
    }

    requestAnimationFrame(
      draw
    );
  }
});