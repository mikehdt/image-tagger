# Centralized Project Configuration

This folder contains centralized project configurations for the image tagger application.

## Structure

- `[project-name].json` - Configuration files for each project
- `[project-name].[ext]` - Thumbnail images (jpg, jpeg, png, webp) with matching project names

## Configuration Options

Each `[project-name].json` file can contain the following options:

```json
{
  "title": "Display Name for Project",
  "color": "emerald",
  "thumbnail": true,
  "featured": true,
  "hidden": false
}
```

### Options:

- **title** (optional): Custom display name for the project
- **color** (optional): Button color - one of: `slate`, `rose`, `amber`, `emerald`, `sky`, `indigo`, `stone`
- **thumbnail** (optional): Set to `true` to look for a thumbnail image with the same name as the project
- **featured** (optional): Whether to show in "Featured Projects" section
- **hidden** (optional): Whether to hide the project from listings

Apart from the thumbnail, all other options are configurable from the interface

## Thumbnail Images

When `thumbnail: true` is set, the system will look for an image file with the same name as the project:

- `my-project.json` + `thumbnail: true` → looks for `my-project.jpg`, `my-project.png`, etc.
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`
- The system checks for files in that order and uses the first one found

## Local Privacy Control

Projects can also have a local `_project.json` file in their folder for privacy:

```json
{
  "private": true
}
```

This will hide the project from listings. The centralized config takes precedence for all other settings.

## Priority

1. Centralized config (`/public/projects/[name].json`) - Full feature set
2. Local config (`[project-folder]/_project.json`) - Privacy only
3. Default behavior if no config exists

## Examples

### Featured Project with Thumbnail

```json
{
  "title": "🌟 Best Work 2024",
  "color": "sky",
  "thumbnail": true,
  "featured": true
}
```

Files: `best-work-2024.json` + `best-work-2024.jpg`

### Simple Project

```json
{
  "title": "Nature Photography",
  "color": "emerald"
}
```

### Hidden Project (via centralized config)

```json
{
  "title": "Work in Progress",
  "hidden": true
}
```
