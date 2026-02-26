# Settings Editor Extension

The **Settings Editor** extension provides a visual interface for managing IDE preferences. It dynamically discovers settings from all registered extensions and presents them in an easy-to-use form within a center-panel tab.

## Features

- **Visual Configuration**: Manage boolean (toggles), number, enum (dropdown), and string (text) settings.
- **Automatic Saving**: All changes are saved automatically as you edit.
- **Search & Filter**: Quickly find specific settings by key, label, or description using the real-time search bar.
- **Collapsible Sections**: Settings are organized into collapsible sections based on their source (e.g., Editor, Extension-specific).
- **Reset Functionality**: Reset individual settings to their defaults or use "Reset All" to restore all preferences.
- **Keyboard Shortcut**: Open the settings tab instantly with `Ctrl+,`.
- **Integrated Access**: Access via the **Activity Bar** (cog icon), the **File > Preferences** menu, or the Command Palette.

## Interface

The Settings Editor opens as a dedicated tab in the **Center Panel**.

### Navigation:
- Click the **cog** icon (⚙️) in the Activity Bar.
- Select **File > Preferences > Settings** from the top menu.
- Use the keyboard shortcut: `Ctrl+,`.
- Run the `settings.open` command from the Command Palette.

### Search:
Use the search bar at the top to filter settings. The filter applies to setting keys, titles, and descriptions across all sections.

## Commands

- `settings.open`: Opens the Settings Editor tab in the center panel.

## Development

To build the extension from source:

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Build the bundle:
    ```bash
    npm run build
    ```
3.  The output will be generated in the `dist/` directory.