/**
 * Simple Canvas Extension Entry Point
 */
export function activate(context: any) {
    console.log("Hello World Extension Activated!");

    // Example: Registering a command in the IDE
    if (context.commands) {
        context.commands.registerCommand('hello.world', () => {
            console.log("Hello from the command palette!");
        });
    }

    return {
        name: "Hello World",
        status: "active"
    };
}

export function deactivate() {
    console.log("Hello World Extension Deactivated.");
}