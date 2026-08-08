# Project Sirens — Scenery Assets

This folder contains the environmental artwork used by Project Sirens.

## Main Scenery

The primary room background is:

`project_sirens_scenery_transparent.png`

This image is loaded by `game.js` using:

`assets/scenery/project_sirens_scenery_transparent.png`

## Purpose

The scenery artwork provides the visual environment for the Project Sirens game, including:

- Fountain
- Wooden floors
- Stairs
- Windows
- Plants
- Furniture
- Lamps
- Decorative objects
- Interior walls

## File Requirements

The scenery image should remain a valid PNG file and should retain its exact filename:

`project_sirens_scenery_transparent.png`

Do not rename the file unless the corresponding path in `game.js` is also changed.

## Project Structure

```text
ProjectSirens/
├── game.js
├── index.html
└── assets/
    ├── characters/
    │   └── player/
    │       └── player_sprite_sheet.png
    │
    └── scenery/
        ├── project_sirens_scenery_transparent.png
        └── README.md
