# Centralized Project Configuration

This folder contains centralized project configurations for the image tagger application.

## Structure

- `[project-name].json` - Configuration files for each project
- `[thumbnail-file].*` - Thumbnail images referenced by the config files

## Configuration Options

Each `[project-name].json` file can contain the following options:

```json
{
  "title": "Display Name for Project",
  "color": "emerald", 
  "thumbnail": "project-thumbnail.jpg",
  "featured": true,
  "hidden": false
}
```

### Options:

- **title** (optional): Custom display name for the project
- **color** (optional): Button color - one of: `slate`, `rose`, `amber`, `emerald`, `sky`, `indigo`, `stone`
- **thumbnail** (optional): Filename of thumbnail image in this folder
- **featured** (optional): Whether to show in "Featured Projects" section
- **hidden** (optional): Whether to hide the project from listings

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

### Featured Project
```json
{
  "title": "🌟 Best Work 2024",
  "color": "sky", 
  "thumbnail": "best-work-thumb.jpg",
  "featured": true
}
```

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
