import { projects } from "./projects-data.js";

// Holds the currently-attached keydown handler so it can be removed
// before a new one is attached — without this, visiting project A, then
// B, then C would leave 3 handlers all firing on every arrow-key press,
// since the router keeps this module alive across navigations instead
// of the page (and its listeners) being thrown away like before.
let activeKeydownHandler = null;

function initProjectDetail() {
  const els = {
    title: document.getElementById("pd-title"),
    tech: document.getElementById("pd-tech"),
    description: document.getElementById("pd-description"),
    links: document.getElementById("pd-links"),
    gallerySection: document.getElementById("pd-gallery-section"),
    gallery: document.getElementById("pd-gallery"),
    videoSection: document.getElementById("pd-video-section"),
    video: document.getElementById("pd-video"),
    videoPrev: document.getElementById("pd-video-prev"),
    videoNext: document.getElementById("pd-video-next"),
    videoCounter: document.getElementById("pd-video-counter"),
    lightbox: document.getElementById("pd-lightbox"),
    lightboxImg: document.getElementById("pd-lightbox-img"),
    lightboxPrev: document.getElementById("pd-lightbox-prev"),
    lightboxNext: document.getElementById("pd-lightbox-next"),
    lightboxClose: document.getElementById("pd-lightbox-close"),
  };

  // We're not currently showing project.html's content — nothing to do.
  // (Runs on every page:swap regardless of which page was swapped in,
  // so this bails out cleanly on all the other pages.)
  if (!els.title) return;

  // Always clear out any handler left over from a previous project visit
  // before doing anything else below.
  if (activeKeydownHandler) {
    document.removeEventListener("keydown", activeKeydownHandler);
    activeKeydownHandler = null;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const project = projects[id];

  if (!project) {
    document.querySelector("#pd-about .wrap").innerHTML =
      `<p style="color:var(--text-muted)">Project not found. <a href="projects.html" style="color:var(--axis-z)">Back to all projects →</a></p>`;
    return;
  }

  document.title = `${project.title} — Marimuthu Selvam`;
  els.title.textContent = project.title;
  els.description.textContent = project.description;

  (project.tech || []).forEach(t => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = t;
    els.tech.appendChild(chip);
  });

  // ---------------- Primary action button (Play now / Download) ----------------
  const primaryActionEl = document.getElementById("pd-primary-action");
  if (primaryActionEl && project.primaryAction) {
    const { type, href } = project.primaryAction;
    const a = document.createElement("a");
    a.href = href;
    a.className = "hero-action-btn";
    a.textContent = type === "download" ? "⬇ Download" : "▶ Play now";
    // External links (itch.io, etc.) open in a new tab so the portfolio stays open;
    // internal links (like a game hosted in this same site) stay in the same tab.
    if (/^https?:\/\//.test(href)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    primaryActionEl.appendChild(a);
  }

  (project.links || []).forEach(link => {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    els.links.appendChild(a);
  });

  const basePath = `../assets/projects/${project.folder}`;

  // ---------------- Hero thumbnail ----------------
  const thumbImg = document.getElementById("pd-thumbnail");
  const thumbWrap = document.getElementById("pd-thumbnail-wrap");
  if (thumbImg && thumbWrap) {
    thumbImg.alt = `${project.title} thumbnail`;
    thumbImg.addEventListener("error", () => {
      thumbWrap.style.display = "none";
    });
    thumbImg.src = `${basePath}/thumbnail.png`;
  }

  // ---------------- Gallery + lightbox ----------------
  let lightboxIndex = 0;

  if (project.images && project.images.length) {
    els.gallerySection.hidden = false;
    project.images.forEach((filename, i) => {
      const img = document.createElement("img");
      img.src = `${basePath}/images/${filename}`;
      img.alt = `${project.title} screenshot ${i + 1}`;
      img.loading = "lazy";
      img.addEventListener("click", () => openLightbox(i));
      els.gallery.appendChild(img);
    });
  }

  function openLightbox(index) {
    lightboxIndex = index;
    els.lightboxImg.src = `${basePath}/images/${project.images[lightboxIndex]}`;
    els.lightbox.hidden = false;
    // Force a reflow so the browser registers the "closed" state before we
    // add "is-open" — otherwise the opacity/scale transition has no starting
    // point to animate from and just snaps straight to open.
    void els.lightbox.offsetWidth;
    els.lightbox.classList.add("is-open");
  }
  function closeLightbox() {
    els.lightbox.classList.remove("is-open");
    // Wait for the CSS fade/scale transition (250ms) to finish before actually
    // hiding the element, so it fades out instead of vanishing instantly.
    setTimeout(() => {
      els.lightbox.hidden = true;
    }, 250);
  }
  function lightboxStep(dir) {
    lightboxIndex = (lightboxIndex + dir + project.images.length) % project.images.length;
    els.lightboxImg.src = `${basePath}/images/${project.images[lightboxIndex]}`;
  }

  els.lightboxClose.addEventListener("click", closeLightbox);
  els.lightbox.addEventListener("click", (e) => {
    if (e.target === els.lightbox) closeLightbox();
  });
  els.lightboxPrev.addEventListener("click", () => lightboxStep(-1));
  els.lightboxNext.addEventListener("click", () => lightboxStep(1));

  // ---------------- Video panel ----------------
  let videoIndex = 0;

  if (project.videos && project.videos.length) {
    els.videoSection.hidden = false;
    loadVideo(0);

    // Auto-advance to the next video when the current one finishes.
    // Wrapping the index with modulo means the whole queue loops continuously.
    els.video.addEventListener("ended", () => stepVideo(1));
    els.videoPrev.addEventListener("click", () => stepVideo(-1));
    els.videoNext.addEventListener("click", () => stepVideo(1));
  }

  function loadVideo(index) {
    videoIndex = index;
    const filename = project.videos[videoIndex];
    els.video.src = `${basePath}/videos/${filename}`;
    // Single video: loop it in place. Multiple videos: let "ended" advance the queue instead.
    els.video.loop = project.videos.length === 1;
    els.videoCounter.textContent = `${videoIndex + 1} / ${project.videos.length}`;
    els.video.play().catch(() => {
      /* Autoplay can be blocked before user interaction — controls remain available. */
    });
  }
  function stepVideo(dir) {
    const next = (videoIndex + dir + project.videos.length) % project.videos.length;
    loadVideo(next);
  }

  // ---------------- Keyboard navigation ----------------
  // Left/Right control whichever media view is active: the image lightbox if it's open,
  // otherwise the video queue (if this project has videos).
  activeKeydownHandler = (e) => {
    if (e.key === "Escape" && !els.lightbox.hidden) {
      closeLightbox();
      return;
    }
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const dir = e.key === "ArrowRight" ? 1 : -1;

    if (!els.lightbox.hidden && project.images && project.images.length) {
      e.preventDefault();
      lightboxStep(dir);
    } else if (project.videos && project.videos.length) {
      e.preventDefault();
      stepVideo(dir);
    }
  };
  document.addEventListener("keydown", activeKeydownHandler);
}

initProjectDetail();
document.addEventListener('page:swap', initProjectDetail);

export default initProjectDetail;