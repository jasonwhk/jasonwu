# 3D Phonics Trainer

A touch-first, emotionally safe phonics practice app for a single child (age 5). It uses a floating 3D card (Three.js), WebAudio mic level detection, and optional Web Speech API encouragement. Everything runs in the browser with no build step and is ready for GitHub Pages.

## Features
- Calm fullscreen 3D card with gentle breathing motion
- Phoneme mode and blending (CVC) mode
- Press-and-hold mic button with live level ring
- Gentle success feedback (sparkle burst + glow)
- Offline-friendly: all assets local, optional audio files
- Parent view with progress table and reset

## Run locally
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000/games/3d-phonics-trainer/` in a browser.

## Deploy on GitHub Pages
1. Push this repo to GitHub.
2. In **Settings → Pages**, set the source to the main branch (root).
3. Save and wait for Pages to publish.
4. Your app will be available at `https://<username>.github.io/<repo>/games/3d-phonics-trainer/`.

## iOS notes
- Microphone access requires a user gesture (press and hold the mic button).
- SpeechRecognition is often unavailable on iOS; the app works without it.
- SpeechSynthesis should be triggered by a tap (Listen button).

## Audio assets
Optional audio files can be placed in:
- `audio/phonemes/` for phoneme cues
- `audio/words/` for word cues

If no audio files are present, the app will fall back to a gentle WebAudio cue for phonemes and SpeechSynthesis for words.
