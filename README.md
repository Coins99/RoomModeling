# RoomModeling

A browser-based 3D room editor for arranging furniture, editing room dimensions and preserving designs as portable JSON documents.

```text
Editor controls ─► semantic room document ─┬─► Three.js scene
                                           ├─► save / autosave
                                           └─► undo / redo
```

The editor uses vanilla JavaScript and Three.js. The saved document is renderer-independent: room and furniture dimensions use canonical millimetres, while the rendering adapter converts them to Three.js metres.

## Quick start

You need Node.js 18 or newer. The project has no packages to install.

```bash
npm start
```

Then open <http://127.0.0.1:8000/3d/>. The first load needs an internet connection because Three.js is imported from a CDN.

On Windows PowerShell, use `npm.cmd start` if script execution policy blocks `npm`. To use another port:

```bash
npm start -- --port 8001
```

## Commands

| Command | What it does |
|---|---|
| `npm start` | Start the dependency-free local server on port 8000 |
| `npm start -- --port 8001` | Start the server on another port |
| `npm test` | Run model, migration, persistence and scene-adapter tests |

## Current features

- Build a rectangular room and edit its dimensions and surface colours.
- Add boxes, spheres, chairs and custom box, sphere, cylinder or cone objects.
- Select, move, rotate, scale, duplicate and delete furniture.
- Use grid and rotation snapping plus undo/redo history.
- Save, load and autosave versioned room documents.
- Export the current 3D view as a PNG.
- Migrate recoverable `version: "1.0"` metre-based saves to the current schema.

## Document model

The current schema records semantic application data instead of Three.js meshes:

- Millimetres as the canonical internal unit.
- Y up, with the X/Z floor plane and the room origin at the floor centre.
- Furniture origins at the centre of their floor footprint.
- Explicit furniture dimensions, transforms, materials and stable IDs.
- Wall-attached door and window data with documented offset directions.
- Versioned imports that are migrated and validated before the live scene changes.

Manual save, autosave and history share the same serializer. Renderer factories rebuild supported furniture and openings from the document rather than restoring every item as a generic cube.

## Project layout

| Path | Contents |
|---|---|
| `3d/app.js` | Application composition and shared editor state |
| `3d/src/model/` | Canonical schema, validation, migration and persistence |
| `3d/src/render/` | Semantic document ↔ Three.js adapters and object factories |
| `3d/src/features/` | Room, furniture and editor UI features |
| `3d/src/systems/` | Camera, input, animation and document history |
| `test/` | Dependency-free Node test suite |
| `scripts/serve.js` | Local static development server |

## Implementation status

R1, canonical scene model and deterministic persistence, is in progress. Nine deterministic tests cover schema validation, legacy migration, semantic round trips, coordinate conversion, scale handling and renderer reconstruction. All JavaScript files also pass syntax checking.

Remaining R1 work includes browser coverage for every furniture and opening factory, rollback verification for renderer failures, measured repeated-load resource checks and routing every editing operation through document commands. Dimension-aware editing, precision placement, spatial validation and linked floor-plan/3D editing follow in later milestones.

## Troubleshooting

**PowerShell says `npm.ps1` cannot be loaded** — run `npm.cmd start` or `npm.cmd test`.

**The page is blank when opening `3d/index.html` directly** — ES modules require an HTTP server. Run `npm start` and use the displayed URL.

**Three.js fails to load** — check the internet connection or the browser console. Runtime Three.js modules currently come from `unpkg.com`.

**Port 8000 is already in use** — run `npm start -- --port 8001` and open the URL printed by the server.
