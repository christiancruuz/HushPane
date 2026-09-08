const shell = document.querySelector("#shell");
const viewport = document.querySelector("#viewport");
const content = document.querySelector("#content");

let state = {
  speed: 34,
  fontSize: 44,
  opacity: 82,
  lineHeight: 1.42,
  running: false,
  mirrored: false,
};
let previousFrame;
let autoScrolling = false;

function applyState(nextState) {
  const textChanged = nextState.text !== state.text;
  state = nextState;

  if (textChanged) content.textContent = state.text;
  shell.style.setProperty("--prompt-opacity", state.opacity / 100);
  shell.style.setProperty("--prompt-font-size", `${state.fontSize}px`);
  shell.style.setProperty("--prompt-line-height", state.lineHeight);
  shell.classList.toggle("running", state.running);
  shell.classList.toggle("mirrored", state.mirrored);
  shell.classList.toggle("interactive", !state.clickThrough);
}

function reset() {
  viewport.scrollTop = 0;
  previousFrame = undefined;
}

function animate(timestamp) {
  if (previousFrame === undefined) previousFrame = timestamp;
  const elapsedSeconds = Math.min((timestamp - previousFrame) / 1000, 0.1);
  previousFrame = timestamp;

  if (state.running) {
    const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    autoScrolling = true;
    viewport.scrollTop = Math.min(
      maxScroll,
      viewport.scrollTop + state.speed * elapsedSeconds,
    );
    autoScrolling = false;

    if (viewport.scrollTop >= maxScroll && maxScroll > 0) {
      window.clearCue.update({ running: false });
    }
  }

  requestAnimationFrame(animate);
}

window.clearCue.onState(applyState);
window.clearCue.onReset(reset);

viewport.addEventListener("wheel", (event) => {
  if (state.running) window.clearCue.update({ running: false });
}, { passive: true });

viewport.addEventListener("scroll", () => {
  if (!autoScrolling) previousFrame = undefined;
}, { passive: true });

window.addEventListener("keydown", (event) => {
  if (!["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(event.key)) return;
  if (state.running) window.clearCue.update({ running: false });
});

window.clearCue.requestState();
requestAnimationFrame(animate);
