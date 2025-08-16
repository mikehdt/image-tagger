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
└── _project.json
```

### 2. Create \_project.json (optional)

If need be, you can hide folders with the `_project.json` file

```json
{
  "private": true
}
```

This is the only option available for individual folder project configuration. More broad configuration is available for projects in the `public/projects` folder.
