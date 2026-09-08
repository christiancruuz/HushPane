# ClearCue Invisible Teleprompter

ClearCue is a local Electron teleprompter with a transparent, always-on-top
overlay. It is designed to remain private when you share a specific application
window or browser tab in Zoom, Google Meet, Teams, and similar tools.

## Run

On this Mac, double-click **Launch ClearCue.command**. For development on any
supported desktop platform, install Node.js 22.12 or newer and run:

```bash
npm install
npm start
```

## During a call

1. Open your presentation and ClearCue.
2. In the meeting app, choose **Share window**, **Share application**, or
   **Share tab**.
3. Select only the presentation—not the whole desktop.
4. Paste your script into the ClearCue control window and press
   **Start prompting**.

## Shortcuts

- `Command/Ctrl + Shift + Space`: pause or resume
- `Command/Ctrl + Shift + Up/Down`: adjust speed
- `Command/Ctrl + Shift + R`: reset to the beginning
- `Command/Ctrl + Shift + H`: hide or show the prompt

Move the pointer over the teleprompter and scroll normally with a mouse or
trackpad. Arrow keys and Page Up/Down also work when the prompt is focused. Any
manual scroll pauses automatic scrolling. Optional **Click-through mode** lets
clicks reach applications behind the overlay, but it also disables mouse
scrolling until turned off.

## Capture-protection limitations

- **Windows 10 version 2004 and newer:** Electron requests
  `WDA_EXCLUDEFROMCAPTURE` for the overlay.
- **macOS:** capture protection is best effort. Modern capture software can still
  capture protected windows during full-display sharing.
- **Linux:** there is no consistent cross-desktop window-exclusion API.

For all operating systems, sharing only the presentation window or browser tab
is the dependable workflow. Always conduct a private test call before an
important presentation.
