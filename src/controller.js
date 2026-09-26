const elements = {
  script: document.querySelector("#script"),
  wordCount: document.querySelector("#word-count"),
  play: document.querySelector("#play"),
  reset: document.querySelector("#reset"),
  visibility: document.querySelector("#visibility"),
  speed: document.querySelector("#speed"),
  speedValue: document.querySelector("#speed-value"),
  fontSize: document.querySelector("#font-size"),
  fontSizeValue: document.querySelector("#font-size-value"),
  opacity: document.querySelector("#opacity"),
  opacityValue: document.querySelector("#opacity-value"),
  clickThrough: document.querySelector("#click-through"),
  mirrored: document.querySelector("#mirrored"),
  status: document.querySelector("#status"),
  theme: document.querySelector("#theme"),
};

let currentState;
let saveTimer;

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function saveState(state) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem("clearCueState", JSON.stringify({
      text: state.text,
      speed: state.speed,
      fontSize: state.fontSize,
      opacity: state.opacity,
      mirrored: state.mirrored,
      theme: state.theme,
    }));
  }, 120);
}

function render(state) {
  currentState = state;
  if (document.activeElement !== elements.script) elements.script.value = state.text;
  elements.wordCount.textContent = `${countWords(state.text)} words`;
  elements.speed.value = state.speed;
  elements.speedValue.textContent = `${state.speed} px/s`;
  elements.fontSize.value = state.fontSize;
  elements.fontSizeValue.textContent = `${state.fontSize} px`;
  elements.opacity.value = state.opacity;
  elements.opacityValue.textContent = `${state.opacity}%`;
  elements.clickThrough.checked = state.clickThrough;
  elements.mirrored.checked = state.mirrored;
  elements.play.textContent = state.running ? "Pause prompting" : "Start prompting";
  elements.visibility.textContent = state.visible ? "Hide prompt" : "Show prompt";
  elements.status.classList.toggle("running", state.running);
  elements.status.lastElementChild.textContent = state.running
    ? "Prompt scrolling"
    : "Prompt ready";
  const dark = state.theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  elements.theme.textContent = dark ? "Light" : "Dark";
  elements.theme.setAttribute("aria-pressed", String(dark));
  elements.theme.setAttribute(
    "aria-label",
    dark ? "Switch to light theme" : "Switch to dark theme",
  );
  saveState(state);
}

elements.script.addEventListener("input", () => {
  const text = elements.script.value;
  elements.wordCount.textContent = `${countWords(text)} words`;
  window.clearCue.update({ text });
});

elements.play.addEventListener("click", () => {
  window.clearCue.update({ running: !currentState.running });
});

elements.reset.addEventListener("click", () => window.clearCue.reset());

elements.visibility.addEventListener("click", () => {
  window.clearCue.update({ visible: !currentState.visible });
});

for (const [input, key] of [
  [elements.speed, "speed"],
  [elements.fontSize, "fontSize"],
  [elements.opacity, "opacity"],
]) {
  input.addEventListener("input", () => {
    window.clearCue.update({ [key]: Number(input.value) });
  });
}

elements.clickThrough.addEventListener("change", () => {
  window.clearCue.setClickThrough(elements.clickThrough.checked);
});

elements.mirrored.addEventListener("change", () => {
  window.clearCue.update({ mirrored: elements.mirrored.checked });
});

elements.theme.addEventListener("click", () => {
  window.clearCue.update({ theme: currentState?.theme === "dark" ? "light" : "dark" });
});

const aboutBackdrop = document.querySelector("#about-backdrop");
const aboutPanel = document.querySelector("#about");
const aboutOpen = document.querySelector("#about-open");
const aboutClose = document.querySelector("#about-close");

function aboutFocusable() {
  return [...aboutPanel.querySelectorAll("a[href], button:not([disabled])")];
}

function openAbout() {
  aboutBackdrop.hidden = false;
  document.body.classList.add("about-open");
  aboutOpen.setAttribute("aria-expanded", "true");
  aboutClose.focus();
}

function closeAbout() {
  if (aboutBackdrop.hidden) return;
  aboutBackdrop.hidden = true;
  document.body.classList.remove("about-open");
  aboutOpen.setAttribute("aria-expanded", "false");
  aboutOpen.focus();
}

aboutOpen.addEventListener("click", openAbout);
aboutClose.addEventListener("click", closeAbout);
aboutBackdrop.addEventListener("click", (event) => {
  if (event.target === aboutBackdrop) closeAbout();
});

document.addEventListener("keydown", (event) => {
  if (aboutBackdrop.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeAbout();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = aboutFocusable();
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.clearCue.onState(render);

const saved = localStorage.getItem("clearCueState");
if (saved) {
  try {
    window.clearCue.update(JSON.parse(saved));
  } catch {
    window.clearCue.requestState();
  }
} else {
  window.clearCue.requestState();
}
