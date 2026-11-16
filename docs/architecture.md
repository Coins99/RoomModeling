# Architecture

RoomModeling separates an editable room document from the Three.js scene used to display it. This makes saved designs explicit and keeps persistence testable without WebGL.

## Data flow

1. The editor collects the current room, furniture and openings into a semantic document.
2. `model/persistence.js` serializes that document for files, autosave and history.
3. Imports go through `model/migrate.js` and `model/validate.js`.
4. `render/sceneDocument.js` reconstructs supported objects through the renderer factories.

Paths below are relative to `3d/src/`.

| Layer | Files | Responsibility |
| --- | --- | --- |
| Model | `model/document.js`, `validate.js` | Schema version, defaults, units and constraints |
| Persistence | `model/persistence.js`, `migrate.js` | JSON boundaries and legacy conversion |
| Rendering | `render/sceneDocument.js`, `objectRegistry.js` | Convert between semantic values and renderer objects |
| Features | `features/room/`, `features/furniture/`, `features/ui/` | Room construction, furniture and editing controls |
| Systems | `systems/` | Input, camera, animation and history |

## Coordinate contract

- Schema version: `2`; canonical units: millimetres.
- Y points upward; the floor is the X/Z plane.
- The room origin is the centre of its floor.
- Object origins are at the centre of the floor footprint, at the object's base.
- Rotations are radians around Y.
- Three.js rendering uses metres and mesh-centred geometry; the adapter handles the conversion.
- Opening offsets follow each wall's documented direction in `coordinateSystem.wallOffsetDirections`.

Keeping these conventions in the file avoids tying a design to a mesh's incidental scale or origin. [The studio sample](../examples/studio.json) is a complete document.

## Validation and compatibility

The validator checks supported object/opening kinds, unique IDs, finite dimensions and transforms, colours, wall bounds and preferences. Persistence bounds input size; unknown schema versions fail rather than being guessed. The migrator accepts recoverable legacy metre-based saves.

The current validator is a structural boundary. It does not establish furniture clearance, collision avoidance or architectural suitability.

## Verification

Run `npm test` from the repository root. Tests exercise schema validation, legacy migration, persistence round trips and scene adaptation with renderer doubles.

These checks do not establish full browser behavior or repeated-load GPU resource stability. The [README status](../README.md#status-and-limits) records those remaining checks. Three.js is loaded from a CDN at runtime; application logic uses plain ES modules.
