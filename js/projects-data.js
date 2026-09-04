// Central data source for the project detail page (html/project.html).
//
// HOW TO ADD MEDIA:
// 1. Drop your files into: assets/projects/<folder>/images/  and  assets/projects/<folder>/videos/
// 2. List the exact filenames below in that project's "images" / "videos" arrays.
// The detail page reads this file and builds the gallery + video panel from whatever's listed here —
// it can't "see" a folder's contents on its own, so this list is the source of truth.

export const projects = {

  "cafe-rush": {
    title: "Café Rush",
    scene: "SCENE_00",
    tech: ["Three.js", "JavaScript", "HTML", "CSS"],
    description:
      "A 3D browser-based cooking simulation where players manage orders, prepare ingredients, and serve dishes before customers lose patience. Players can choose from different difficulty levels, with higher difficulties increasing the pace and pressure.\n\n" +
      "Developed the core gameplay systems using Three.js and JavaScript, including cooking stations, order management, customer behaviour, and difficulty progression. Built the UI and gameplay flow with HTML and CSS." +
      "Created and integrated 3D assets using Blender and Mixamo. Combined and adapted Mixamo animations to create the game's character animations, then integrated them into the Three.js environment.",
    folder: "cafe-rush",
    // primaryAction renders as a small button right under the title.
    // type: "play" → label reads "▶ Play now"   |   type: "download" → label reads "⬇ Download"
    primaryAction: { type: "play", href: "../games/CafeToss/index.html" },
    images: [
      "Gameplay1.png",
      "Gameplay2.png",
      "Gameplay3.png"
    ],
    videos: [
      "CafeRush1.mp4",
      "CafeRush2.mp4",
      "CafeRush3.mp4",
      "CafeRush4.mp4"
    ],
    links: []
  },

  "eclipsa": {
    title: "Eclipsa — VR vs PC",
    scene: "SCENE_01",
    tech: ["Unity", "C#", "Blender", "Mixamo"],
    description: `An action combat game built around asymmetric multiplayer, where VR and PC players have different roles and combat abilities. Each round, the VR player attempts to knock the PC player from the arena while the PC player fights back with weapons.\n\n
    Developed the core gameplay and combat systems using Unity and C#, including player interactions, attacks, and round-based gameplay logic.
    Created and adapted character animations using Blender and Mixamo, then combined and refined animations further in Unity before integrating them into the game.`,
    folder: "eclipsa",
    primaryAction: { type: "download", href: "#" },
    images: [
      "1.png",
      "2.png",
      "3.png",
      "4.png"
    ],
    videos: [
      "1.mp4",
      "2.mp4"
    ],
    links: []
  },

  "platformer": {
    title: "Just a Platformer",
    scene: "SCENE_02",
    tech: ["GDevelop 5", "Piskel"],
    description: `A 2D platformer developed collaboratively by a team of three, featuring a simple visual style built from geometric shapes and custom pixel art. All game assets were created from scratch.\n\n
    Developed the core player mechanics, including movement, platforming, collisions, and environment interactions. Worked with teammates to integrate independently developed assets and gameplay systems.
    Built the game using GDevelop 5 and contributed to the project's custom pixel art and visual design using Piskel.`,
    folder: "platformer",
    primaryAction: { type: "play", href: "https://chimuarufa.itch.io/just-a-platformer" },
    images: [
      "1.png",
      "2.png",
      "4.png",
      "5.png"
    ],
    videos: [
      "JAP1.mp4",
      "JAP2.mp4",
      "JAP3.mp4"
    ],
    links: []
  },

  "hitman": {
    title: "Hitman — Top-Down Shooter",
    scene: "SCENE_03",
    tech: ["GDevelop 5", "Piskel"],
    description: `An arcade-style top-down shooter focused on fast-paced combat and score-based gameplay. Players fight through waves of zombies, manage their health, and aim for the highest possible score.\n\n
    Developed the core gameplay systems, including player movement, aiming, shooting, enemy behaviour, health, scoring, and wave-based progression.
    Created and integrated the game's 2D visual assets using GDevelop 5, with custom pixel art created in Piskel.`,
    folder: "hitman",
    primaryAction: { type: "download", href: "https://shredninjar.itch.io/hitman-top-down-shooter" },
    images: [
      "1.png",
      "2.png",
      "3.png",
      "4.png"
    ],
    videos: [
      "Hitman1.mp4",
      "Hitman2.mp4",
      "Hitman3.mp4"
    ],
    links: []
  },

  "auditorium": {
    title: "Auditorium Management System",
    scene: "SCENE_04",
    tech: ["SQL", "MySQL", "Visual Studio"],
    description: `A database-driven auditorium management system for managing bookings, customers, organizers, events, services, and payments.
    Designed the relational database structure, including tables, primary and foreign keys, and relationships. Implemented CRUD operations, role-based access, booking management, and sales calculations for Admin, Organizer, and Customer roles.
    Built and tested the application using MySQL Workbench and Visual Studio.`,
folder: "auditorium",
    images: [
      "ERD_Auditorium.jpg",
      "Auditorium1.png",
      "Auditorium2.png",
      "Auditorium3.png",
      "Auditorium4.png",
      "Auditorium5.png",
      "Flowchart.jpg"
    ],
    videos: [
      "Auditorium1.mp4",
      "Auditorium2.mp4"
    ],
    links: []
  }

};