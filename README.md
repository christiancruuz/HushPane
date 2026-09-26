# HushPane Invisible Teleprompter

HushPane is a local Electron teleprompter with a transparent, always-on-top
overlay. It is designed to remain private when you share a specific application
window or browser tab in Zoom, Google Meet, Teams, and similar tools.

## Run

On this Mac, double-click **Launch HushPane.command**. For development on any
supported desktop platform, install Node.js 22.12 or newer and run:

```bash
npm install
npm start
```

## During a call

1. Open your presentation and HushPane.
2. In the meeting app, choose **Share window**, **Share application**, or
   **Share tab**.
3. Select only the presentation—not the whole desktop.
4. Paste your script into the HushPane control window and press
   **Start prompting**.

The prompt stays stacked above native fullscreen windows, such as a slideshow
or a browser in full screen. Exclusive fullscreen used by some games and video
players can still cover it.

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

## Support

HushPane is free. If it helps you, you can
[buy me a coffee](https://buymeacoffee.com/kihongo).
