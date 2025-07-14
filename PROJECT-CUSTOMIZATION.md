# Project Customization Guide

The image tagger now supports customizable project information including titles, button colors, and thumbnails.

## Setting up Project Customization

### 1. Create the Info Folder

In your project folder, create a subfolder named `_info`:

```
YourProject/
├── image1.jpg
├── image1.txt
├── image2.png
├── image2.txt
└── _info/
    ├── project.json
    └── project-thumbnail.jpg
```

### 2. Create project.json

Create a `project.json` file in the `_info` folder with the following structure:

```json
{
  "title": "Your Project Display Name",
  "color": "emerald",
  "thumbnail": "project-thumbnail.jpg",
  "hidden": false,
  "featured": true
}
```

### Configuration Options

#### `title` (optional)

- **Type**: String
- **Description**: A custom display name for your project
- **Default**: Uses the folder name if not specified
- **Example**: `"Nature Photography Collection"`

#### `color` (optional)

- **Type**: String
- **Description**: Button color for the project in the project list
- **Default**: `"slate"` if not specified
- **Available colors**:
  - `"slate"` (default gray)
  - `"rose"` (red/pink)
  - `"amber"` (yellow/orange)
  - `"emerald"` (green)
  - `"sky"` (blue)
  - `"indigo"` (purple/blue)
  - `"stone"` (warm gray)

#### `thumbnail` (optional)

- **Type**: String
- **Description**: Filename of the thumbnail image located in the `_info` folder
- **Default**: Shows folder icon if not specified
- **Supported formats**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Recommendations**:
  - Use square images for best appearance (they'll be displayed in a circle)
  - Recommended size: 200x200 pixels or larger
  - Keep file sizes reasonable for faster loading

#### `hidden` (optional)

- **Type**: Boolean
- **Description**: Whether to hide this project from the project list
- **Default**: `false` if not specified
- **Example**: `true` to hide the project, `false` or omit to show it
- **Use case**: Useful for archiving projects or temporarily hiding work-in-progress projects

#### `featured` (optional)

- **Type**: Boolean
- **Description**: Whether to display this project in the "Featured Projects" section at the top
- **Default**: `false` if not specified
- **Example**: `true` to feature the project, `false` or omit for regular placement
- **Use case**: Highlight your most important or frequently accessed projects

### Example Configurations

#### Minimal Configuration

```json
{
  "title": "My Photo Project"
}
```

#### Full Configuration

```json
{
  "title": "Wildlife Photography - Yellowstone 2024",
  "color": "emerald",
  "thumbnail": "yellowstone-bear.jpg",
  "featured": true
}
```

#### Hidden Project

```json
{
  "title": "Work in Progress",
  "hidden": true
}
```

#### Featured Project

```json
{
  "title": "🌟 My Best Work",
  "color": "sky",
  "featured": true
}
```

### Notes

- All fields in `project.json` are optional
- If no `project.json` exists, the project will use default styling (folder icon, folder name, slate color)
- The `_info` folder and its contents are ignored when counting images in the project
- Thumbnail images are served through the same API as project images but with a special flag
- Invalid color values will fall back to the default `"slate"` color
- If a specified thumbnail file doesn't exist, the folder icon will be used instead
- Hidden projects are completely excluded from the project list but can still be accessed directly if you know the path
- Featured projects appear in a separate "⭐ Featured Projects" section at the top, sorted alphabetically by title
- Regular projects appear in the "📁 Other Projects" section (or "📁 All Projects" if no featured projects exist)
- Both featured and regular projects are sorted alphabetically by their display title

### Troubleshooting

- **Thumbnail not showing**: Check that the filename in `project.json` exactly matches the file in the `_info` folder (case-sensitive)
- **Custom title not appearing**: Ensure the `project.json` file is valid JSON format
- **Color not applying**: Verify the color value is one of the supported options listed above
