# Canvas Extension Hello World

A simple test extension for Canvas IDE to demonstrate basic extension functionality including activation, deactivation, and command registration.

## Features

- **Activation/Deactivation Logging**: Logs status to the console when the extension starts and stops.
- **Command Registration**: Registers a `hello.world` command that can be triggered from the IDE.

## Getting Started

### Prerequisites

- Node.js and npm installed.
- Canvas IDE environment.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/https://github.com/FLYBYME/canvas-extension-hello-world.git
   cd canvas-extension-hello-world
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Building the Extension

To bundle the extension for use in the IDE:

```bash
npm run build
```

This will use `esbuild` to create a bundled ESM file at `dist/bundle.js`.

Here is the complete documentation for developing an extension for the CanvasLLM IDE based on the provided source code.

# CanvasLLM IDE Extension Development Guide

This guide details how to create and manage an extension for the CanvasLLM IDE. Extensions in this framework are dynamically loaded modules that can interact with the core IDE systems, register custom commands, define settings, provide custom UI views, and manipulate the virtual file system.

## 1. Core Extension Contracts

To build an extension, your bundle must export (either as a default or named export) an object or class that implements the `Extension` interface. The `ExtensionManager` evaluates this bundle dynamically from a provided URL.

### The `Extension` Interface

Every extension must fulfill this basic contract:

* **`id`**: A unique string identifier for your extension.
* **`name`**: A human-readable string name for the extension.
* **`version`**: The version string of the extension.
* **`activate(context: ExtensionContext)`**: A method called when the extension is activated. It can return a `Promise<void>` for asynchronous initialization.
* **`deactivate?()`**: An optional method called when the extension is deactivated, such as when disabled or during IDE shutdown.

### The `ExtensionContext`

When your extension is activated, it receives an `ExtensionContext`. This context is used to safely interact with the IDE and manage resource cleanup:

* **`ide`**: Provides access to the main `IDE` class and all its public managers and services.
* **`subscriptions`**: An array of objects with a `dispose()` method. You should push cleanup functions here to prevent memory leaks when your extension is deactivated.
* **`registerConfiguration(node)`**: A specific helper method for registering configuration nodes. Nodes registered this way are automatically unregistered when the extension deactivates.

### Basic Extension Skeleton

```typescript
import { Extension, ExtensionContext } from 'canvas-ide-core';

export default class MyCustomExtension implements Extension {
    public id = 'my.custom.extension';
    public name = 'My Custom Extension';
    public version = '1.0.0';

    public async activate(context: ExtensionContext): Promise<void> {
        context.ide.notifications.notify(`Activated ${this.name}`);
        // Registration logic goes here
    }

    public async deactivate(): Promise<void> {
        // Any custom cleanup logic
    }
}

```

## 2. Accessing IDE Capabilities

Through `context.ide`, your extension can interact with the various subsystems of the IDE.

### Registering Commands

The `CommandRegistry` maps command IDs to executable functions. These commands power the command palette and keyboard shortcuts.

* You can register commands using `context.ide.commands.register(command)`.
* A command requires an `id`, `label`, and a `handler` function.
* Optional properties include `description`, `category`, `keybinding` (e.g., `'Ctrl+Shift+H'`), `icon`, and a `when` function to dictate context availability.

```typescript
context.ide.commands.register({
    id: 'myExtension.sayHello',
    label: 'Say Hello',
    keybinding: 'Ctrl+Shift+H',
    handler: () => {
        context.ide.notifications.notify('Hello from the extension!', 'success');
    }
});

```

### Adding Custom UI Views

You can build custom user interfaces and inject them into various IDE panels (`left-panel`, `right-panel`, `bottom-panel`, or `center-panel`).

* You must create an object implementing the `ViewProvider` interface.
* The `resolveView` method provides an empty DOM `container` where you must append your custom UI. It also provides a `disposables` array for you to push event listener cleanup functions.
* Register the provider using `context.ide.views.registerProvider(location, provider)`.

```typescript
import { ViewProvider } from 'canvas-ide-core';

const myView: ViewProvider = {
    id: 'myExtension.customView',
    name: 'My Custom Sidebar View',
    resolveView: (container, disposables) => {
        const btn = document.createElement('button');
        btn.textContent = 'Click Me';
        
        const onClick = () => console.log('Clicked!');
        btn.addEventListener('click', onClick);
        
        // Ensure event listeners are cleaned up when the view is destroyed
        disposables.push({ dispose: () => btn.removeEventListener('click', onClick) });
        
        container.appendChild(btn);
    }
};

context.ide.views.registerProvider('left-panel', myView);

```

### Extending the Activity Bar

To make sidebars or bottom panels accessible, you can add an icon to the Activity Bar.

* Use `context.ide.activityBar.registerItem(item)`.
* The item requires an `id` (usually matching your `ViewProvider` ID), `location`, `icon` (a FontAwesome class), and a `title`.
* By default, clicking the icon toggles your registered view. You can override this with a custom `onClick` handler.

```typescript
context.ide.activityBar.registerItem({
    id: 'myExtension.customView',
    location: 'left-panel',
    icon: 'fas fa-rocket',
    title: 'My Custom Extension',
    order: 10
});

```

### Defining Configuration Settings

Extensions can declare settings that users can modify.

* Use `context.registerConfiguration(node)` to add a setting schema to the `ConfigurationRegistry`.
* A `ConfigurationNode` requires an `id`, a human-readable `title`, and a map of `properties`.
* Each property requires a `type` (`'string'`, `'number'`, `'boolean'`, or `'enum'`), a `default` value, and a `description`.
* You can read settings at runtime using `context.ide.settings.get<T>(key)`.

```typescript
context.registerConfiguration({
    id: 'myExtensionConfig',
    title: 'My Extension Settings',
    properties: {
        'myExtension.enableFeature': {
            type: 'boolean',
            default: false,
            description: 'Enables the special feature.'
        }
    }
});

// Read the setting
const isEnabled = context.ide.settings.get<boolean>('myExtension.enableFeature');

```

### Manipulating the Virtual File System (VFS)

The IDE uses a Virtual File System backed by a Web Worker. You can access it via `context.ide.vfs`.

* **`readFile(path)`**: Resolves with the file's string content.
* **`writeFile(path, content)`**: Creates or overwrites a file.
* **`delete(path)`**: Deletes a file or directory.
* **`readDirectory(path)`**: Recursively lists all file paths under a directory.
* **`onDidChangeFile(callback)`**: Registers a listener for `change`, `delete`, and `rename` events.

```typescript
// Create a new file
await context.ide.vfs.writeFile('/src/hello.txt', 'Hello World!');

// Read a file
const text = await context.ide.vfs.readFile('/src/hello.txt');

```

### Interacting with Editors and Tabs

You can programmatically open files or custom views in the center panel using the `EditorManager`.

* **`openFile(fileId, title, content, language)`**: Opens a text file using Monaco Editor.
* **`openTab(config)`**: Opens a generic tab. If you pass a `providerId`, it will render the custom UI registered in the `ViewRegistry` inside that tab.
* **`closeTab(id)`**: Closes a specific tab.

```typescript
// Open a custom UI view as an Editor Tab
context.ide.editor.openTab({
    id: 'myExtension.dashboardTab',
    title: 'Dashboard',
    icon: 'fas fa-chart-bar',
    providerId: 'myExtension.customView' // Must map to a registered ViewProvider
});

```

### Notifications and Dialogs

To interact with the user, avoid using native browser alerts and use the built-in services.

* **`NotificationService`**: Provides interactive toast notifications via `context.ide.notifications.notify(message, severity, timeout)`. Severities include `'info'`, `'warning'`, `'error'`, and `'success'`.
* **`DialogService`**: Provides themed modal dialogs via `context.ide.dialogs`. You can use `.confirm(message)` for boolean choices, `.prompt(message)` for text input, and `.showQuickPick(items)` for dropdown selections.

```typescript
// Show a notification
context.ide.notifications.notify('Task completed successfully!', 'success', 3000);

// Prompt the user
const userInput = await context.ide.dialogs.prompt('Enter your API Key:');
if (userInput) {
    console.log('User entered:', userInput);
}

```