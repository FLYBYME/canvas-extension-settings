import { Extension, ExtensionContext } from 'canvas-ide-core';
import { ViewProvider } from 'canvas-ide-core';

export const HelloWorldExtension: Extension = {
    id: 'my.helloworld',
    name: 'Hello World',
    version: '1.0.0',

    activate(context: ExtensionContext) {
        // 1. Register a command
        const commandDisposable = context.ide.commands.registerDisposable({
            id: 'extension.helloWorld',
            label: 'Say Hello',
            handler: () => {
                context.ide.notifications.notify('Hello from the Extension System!', 'info');
            }
        });
        context.subscriptions.push(commandDisposable);

        // 2. Add a Menu Item
        context.ide.layout.header.menuBar.addMenuItem({
            id: 'ext-menu',
            label: 'My Extension',
            items: [
                {
                    id: 'ext-menu:hello',
                    label: 'Say Hello World',
                    onClick: () => context.ide.commands.execute('extension.helloWorld')
                }
            ]
        });

        // 3. Register a UI Provider
        const myProvider: ViewProvider = {
            id: 'my.helloworld.sidebarView',
            name: 'Hello Sidebar',
            resolveView: (container: HTMLElement, disposables: any[]) => {
                container.innerHTML = `
                    <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px; color: var(--text-main); font-family: var(--font-ui);">
                        <h2 style="font-size: 14px; margin: 0; text-transform: uppercase;">Hello World Extension</h2>
                        <p style="font-size: 13px; color: var(--text-muted);">This is a custom UI provided by an extension using the new ViewProvider API!</p>
                        <button id="ext-btn" style="background: var(--accent); color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-family: var(--font-ui);">
                            Click Me
                        </button>
                    </div>
                `;

                // Add event listener to the button
                const btn = container.querySelector('#ext-btn');
                if (btn) {
                    btn.addEventListener('click', () => {
                        context.ide.commands.execute('extension.helloWorld');
                    });
                }
            }
        };

        // Register the provider with the IDE
        context.ide.views.registerProvider('right-panel', myProvider);

        // Do not auto-render immediately; let FileTree be default

        // 4. Add an Activity Bar Icon to trigger the view
        context.ide.activityBar.registerItem({
            id: myProvider.id,
            location: 'right-panel',
            icon: 'fas fa-plug',
            title: 'Hello Extension',
            order: 100
        });
    }
};
