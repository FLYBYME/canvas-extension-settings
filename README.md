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

## Extension API Usage

### `activate(context)`

The main entry point called by the IDE when the extension is loaded.

```typescript
export function activate(context: any) {
    // Access context and register functionality
}
```

### `deactivate()`

Called by the IDE when the extension is unloaded or the IDE is closing.

## Development

- Source code is located in `src/index.ts`.
- Bundled output is in `dist/bundle.js`.

## License

MIT
