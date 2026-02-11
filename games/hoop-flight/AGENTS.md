# 🎮 Hoop Flight --- Three.js WASD Game

Location: `/games/hoop-flight/` (inside your GitHub Pages homepage repo)

------------------------------------------------------------------------

## 🎯 Goal

Build a desktop arcade-style 3D flying game using Three.js where the
player flies a small plane through hoops in the sky (GTA-style
checkpoint race).

No build tools.\
No backend.\
Pure static ES module project compatible with your existing homepage
structure.

Keyboard control only (WASD).

------------------------------------------------------------------------

# 🗂 Folder Structure

Create inside your repo:

    games/
      hoop-flight/
        index.html
        main.js
        style.css

Must run directly on GitHub Pages without bundling.

------------------------------------------------------------------------

# 🎮 Controls

W / S → Pitch\
A / D → Yaw\
Q / E → Roll\
Shift → Increase throttle\
Ctrl → Decrease throttle\
R → Restart run\
Space → Respawn at last hoop

------------------------------------------------------------------------

# 🧠 Architecture Overview

## Core Systems

1.  Scene setup (renderer, camera, lighting)
2.  Plane controller (quaternion-based rotation)
3.  Forward physics-lite movement
4.  Hoop generator (CatmullRom spline path)
5.  Hoop pass detection
6.  Chase camera system
7.  UI overlay (score + timer)
8.  Audio feedback (WebAudio oscillator ding)

------------------------------------------------------------------------

# ✈️ Plane System

## Movement Model

-   Plane always moves forward along its local -Z axis.
-   Orientation controlled via quaternion rotations.
-   Speed controlled by throttle (clamped).
-   No full aerodynamics simulation (arcade feel).

## State Variables

-   position
-   quaternion
-   throttle
-   speed
-   lastCheckpointIndex

------------------------------------------------------------------------

# 🟡 Hoop System

## Generation

-   Generate \~20 3D points
-   Use `THREE.CatmullRomCurve3`
-   Place hoops every N distance along curve
-   Align hoop normal with curve tangent

## Hoop Properties

-   position
-   normal
-   radius (5 units)
-   thickness (0.5)
-   passed flag

------------------------------------------------------------------------

# ✔️ Hoop Pass Detection

Each frame:

1.  Compute plane position relative to current hoop.
2.  Check if plane crosses hoop plane.
3.  Check if distance from hoop center \< radius.
4.  If true:
    -   increment score
    -   advance currentHoop
    -   play sound
    -   update checkpoint

------------------------------------------------------------------------

# 📷 Camera System

Chase camera logic:

    desiredPosition =
      plane.position
      - forward * followDistance
      + up * followHeight

Smooth via lerp to avoid jitter.

Camera always `lookAt(plane.position)`.

------------------------------------------------------------------------

# ⏱ Timer System

-   Timer starts when first movement input detected.
-   Stops when final hoop passed.
-   Display in top-left UI.
-   Reset on restart.

------------------------------------------------------------------------

# 🔊 Audio Feedback

On hoop pass:

-   Short WebAudio oscillator "ding".
-   No external assets required.

------------------------------------------------------------------------

# 🌤 Visual Design

-   Gradient sky background
-   Directional light (sun)
-   Ambient light
-   Simple red box plane
-   Yellow torus hoops
-   Optional light fog for depth

------------------------------------------------------------------------

# 🔁 Restart Logic

On R key:

-   Reset plane position
-   Reset orientation
-   Reset throttle
-   Reset score
-   Reset timer
-   Reset hoop states

------------------------------------------------------------------------

# 🏁 End Condition

Game ends when all hoops passed. Display:

    FINISHED!
    Final Time: XX.XX

------------------------------------------------------------------------

# 🧪 Testing Checklist

-   Plane rotates correctly on all axes
-   Plane always moves forward
-   Speed clamped between 10--60
-   Hoops aligned smoothly
-   Passing hoop increments score once
-   Camera smoothly follows
-   No frame stutter
-   Restart works cleanly

------------------------------------------------------------------------

# 🚀 Future Upgrades (Not in MVP)

-   Boost mechanic
-   Procedural infinite course
-   Cloud obstacles
-   Ghost replay
-   Leaderboard (localStorage)
-   Particle trail
-   Mobile controls

------------------------------------------------------------------------

# 🧩 Constraints

-   No build step
-   No TypeScript
-   No external model loaders
-   Keep file count minimal
-   Keep code readable

------------------------------------------------------------------------

# 📦 Deliverable Definition of Done

-   Game loads from `/games/hoop-flight/`
-   Fully playable on desktop
-   Smooth 60fps on modern browser
-   Clean restart loop
-   GitHub Pages compatible

------------------------------------------------------------------------

# 🎯 Philosophy

This is an arcade-feel flying game. Responsiveness \> realism. Clarity
\> complexity. Fun \> simulation accuracy.

------------------------------------------------------------------------

End of agent.md
