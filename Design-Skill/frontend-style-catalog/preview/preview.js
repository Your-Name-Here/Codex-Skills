const fallbackThemes = [
  {
    id: "tactical-dark",
    name: "Tactical Dark",
    shortDescription:
      "Dense desktop tool styling with restrained color, sharp hierarchy, and high information density.",
    bestFor: ["trading tools", "dev tools", "editors", "dashboards", "control panels"],
    tags: ["dark", "desktop", "dense", "dashboard", "tooling"],
    example: "../themes/tactical-dark/examples/index.html"
  },
  {
    id: "retro-pixel",
    name: "Retro Pixel",
    shortDescription:
      "Pixel-art inspired interface direction for game tools, asset workflows, and playful creative software.",
    bestFor: ["sprite editors", "game tools", "asset managers", "creative tools"],
    tags: ["pixel", "retro", "games", "editor", "creative"]
  },
  {
    id: "soft-productivity",
    name: "Soft Productivity",
    shortDescription:
      "Calm notebook-style interface with readable rhythm, gentle contrast, and productive focus.",
    bestFor: ["journals", "planners", "recipe apps", "knowledge tools"],
    tags: ["light", "notebook", "calm", "readable", "productivity"]
  }
];

const grid = document.getElementById("theme-grid");
const status = document.getElementById("status");
const template = document.getElementById("theme-card-template");

function makePills(items, className = "pill") {
  const wrapper = document.createElement("div");
  wrapper.className = "pill-list";
  items.forEach((item) => {
    const pill = document.createElement("span");
    pill.className = className;
    pill.textContent = item;
    wrapper.appendChild(pill);
  });
  return wrapper;
}

function renderThemes(themes, sourceLabel) {
  grid.innerHTML = "";

  themes.forEach((theme) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".theme-name").textContent = theme.name;
    node.querySelector(".theme-description").textContent = theme.shortDescription;
    node.querySelector(".theme-best-for").appendChild(makePills(theme.bestFor));
    node.querySelector(".theme-tags").appendChild(makePills(theme.tags));

    const folder = node.querySelector(".theme-folder");
    folder.textContent = `themes/${theme.id}/`;
    folder.classList.add("code-path");

    const actions = node.querySelector(".theme-actions");
    if (theme.example) {
      const exampleLink = document.createElement("a");
      exampleLink.className = "theme-link";
      exampleLink.href = theme.example.startsWith("../") ? theme.example : `../${theme.example}`;
      exampleLink.textContent = "Open Example";
      actions.appendChild(exampleLink);
    }

    grid.appendChild(node);
  });

  status.textContent = sourceLabel;
}

async function loadThemes() {
  try {
    const response = await fetch("../catalog/themes.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const themes = await response.json();
    renderThemes(themes, "Loaded metadata from ../catalog/themes.json");
  } catch (_error) {
    renderThemes(
      fallbackThemes,
      "Using inline fallback data because local file fetch is blocked in this browser."
    );
  }
}

loadThemes();
