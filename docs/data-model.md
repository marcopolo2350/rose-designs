# Data Model

## Project document

Project JSON exports now include:

- `schemaVersion`
- `appVersion`
- `exportedAt`
- `activeProfile`
- `projects`

## Room record

Important room fields in the current runtime:

- `id`
- `projectId`
- `projectName`
- `name`
- `polygon`
- `walls`
- `openings`
- `structures`
- `furniture`
- `dimensionAnnotations`
- `textAnnotations`
- `materials`
- `floorId`
- `floorLabel`
- `floorOrder`
- `roomOrder`
- `baseRoomId`
- `optionName`
- `optionNotes`
- `createdAt`
- `updatedAt`

Imported room records must include a polygon with at least three finite `{ x, y }` points. Optional collection fields such as `furniture`, `openings`, and annotation arrays must be arrays when present. User-facing room and furniture text fields must be strings, stay within length caps, and cannot contain control characters.

## Asset manifest entry

The manifest is the source of truth for catalog asset identity, source tracking, mount type, and mounted placement metadata. Wall, ceiling, and surface entries must declare:

- `mountType`: one of `floor`, `wall`, `surface`, or `ceiling`
- `placement.snapTo`: one of `floor`, `wall`, `surface`, `ceiling`, or `opening`
- `placement.forwardAxis`: one of `+x`, `-x`, `+y`, `-y`, `+z`, or `-z`
- `placement.defaultElevation`: either a fixed numeric height in feet or a ceiling-relative rule such as `{ "relativeTo": "ceiling", "offset": 0.55, "min": 7.2 }`

`npm run validate:manifest` and `npm run validate:placement-rules` guard these rules so wall art, mirrors, sconces, shelves, table lamps, and ceiling lights do not depend on label guessing for their default height.

## Current caveat

The runtime still carries room-centric project state, so project and room boundaries are improving but not fully normalized yet.
