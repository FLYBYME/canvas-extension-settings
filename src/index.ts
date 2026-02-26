import { Extension, ExtensionContext, ViewProvider } from 'canvas-ide-core';

export const SettingsManagerExtension: Extension = {
    id: 'core.settings.manager',
    name: 'Settings Manager',
    version: '1.0.0',

    activate: async (context: ExtensionContext): Promise<void> {
        const ide = context.ide;

        // 1. Define the ViewProvider that renders the Settings UI
        const settingsView: ViewProvider = {
            id: 'core.settings.view',
            name: 'Settings',
            resolveView: (container, disposables) => {
                // Setup container styling
                container.style.padding = '20px 40px';
                container.style.overflowY = 'auto';
                container.style.color = 'var(--text-main)';
                container.style.fontFamily = 'var(--font-ui, sans-serif)';
                container.style.backgroundColor = 'var(--bg-panel)';

                // Header
                const header = document.createElement('h1');
                header.textContent = 'Settings';
                header.style.borderBottom = '1px solid var(--border-color)';
                header.style.paddingBottom = '10px';
                header.style.marginBottom = '20px';
                container.appendChild(header);

                // Fetch all configuration schemas
                const nodes = ide.configurationRegistry.getAll();

                // Build a section for each configuration node
                nodes.forEach(node => {
                    const section = document.createElement('div');
                    section.style.marginBottom = '30px';

                    const sectionTitle = document.createElement('h2');
                    sectionTitle.textContent = node.title;
                    sectionTitle.style.fontSize = '18px';
                    sectionTitle.style.color = 'var(--accent)';
                    sectionTitle.style.marginBottom = '12px';
                    section.appendChild(sectionTitle);

                    // Build UI for each property in the node
                    Object.entries(node.properties).forEach(([key, prop]) => {
                        const settingRow = document.createElement('div');
                        settingRow.style.marginBottom = '16px';
                        settingRow.style.display = 'flex';
                        settingRow.style.flexDirection = 'column';
                        settingRow.style.gap = '6px';

                        // Label
                        const label = document.createElement('label');
                        label.textContent = key;
                        label.style.fontWeight = '600';
                        label.style.fontSize = '14px';

                        // Description
                        const description = document.createElement('div');
                        description.textContent = prop.description;
                        description.style.fontSize = '12px';
                        description.style.color = 'var(--text-muted)';
                        description.style.marginBottom = '4px';

                        // Input Wrapper
                        const inputWrapper = document.createElement('div');
                        inputWrapper.style.display = 'flex';
                        inputWrapper.style.alignItems = 'center';
                        inputWrapper.style.gap = '10px';

                        // Determine current value
                        const currentValue = ide.settings.get(key) ?? prop.default;

                        // Input Element
                        let inputEl: HTMLElement;

                        if (prop.type === 'boolean') {
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.checked = Boolean(currentValue);
                            checkbox.addEventListener('change', async (e) => {
                                const target = e.target as HTMLInputElement;
                                try {
                                    await ide.settings.update(key, target.checked);
                                } catch (err: any) {
                                    ide.notifications.notify(`Failed to update ${key}: ${err.message}`, 'error');
                                    target.checked = !target.checked; // revert UI
                                }
                            });
                            inputEl = checkbox;
                        }
                        else if (prop.type === 'enum' && prop.enum) {
                            const select = document.createElement('select');
                            select.style.padding = '4px 8px';
                            select.style.backgroundColor = 'var(--bg-input)';
                            select.style.color = 'var(--text-main)';
                            select.style.border = '1px solid var(--border-color)';

                            prop.enum.forEach(opt => {
                                const option = document.createElement('option');
                                option.value = opt;
                                option.textContent = opt;
                                if (opt === currentValue) option.selected = true;
                                select.appendChild(option);
                            });

                            select.addEventListener('change', async (e) => {
                                const target = e.target as HTMLSelectElement;
                                try {
                                    await ide.settings.update(key, target.value);
                                } catch (err: any) {
                                    ide.notifications.notify(`Failed to update ${key}: ${err.message}`, 'error');
                                    target.value = currentValue; // revert UI
                                }
                            });
                            inputEl = select;
                        }
                        else if (prop.type === 'number') {
                            const numberInput = document.createElement('input');
                            numberInput.type = 'number';
                            numberInput.value = String(currentValue);
                            numberInput.style.padding = '4px 8px';
                            numberInput.style.backgroundColor = 'var(--bg-input)';
                            numberInput.style.color = 'var(--text-main)';
                            numberInput.style.border = '1px solid var(--border-color)';

                            numberInput.addEventListener('change', async (e) => {
                                const target = e.target as HTMLInputElement;
                                const val = Number(target.value);
                                try {
                                    await ide.settings.update(key, val);
                                } catch (err: any) {
                                    ide.notifications.notify(`Failed to update ${key}: ${err.message}`, 'error');
                                    target.value = String(currentValue); // revert UI
                                }
                            });
                            inputEl = numberInput;
                        }
                        else {
                            // String or fallback
                            const textInput = document.createElement('input');
                            textInput.type = 'text';
                            textInput.value = String(currentValue);
                            textInput.style.padding = '4px 8px';
                            textInput.style.backgroundColor = 'var(--bg-input)';
                            textInput.style.color = 'var(--text-main)';
                            textInput.style.border = '1px solid var(--border-color)';
                            textInput.style.width = '300px';

                            textInput.addEventListener('change', async (e) => {
                                const target = e.target as HTMLInputElement;
                                try {
                                    await ide.settings.update(key, target.value);
                                } catch (err: any) {
                                    ide.notifications.notify(`Failed to update ${key}: ${err.message}`, 'error');
                                    target.value = String(currentValue); // revert UI
                                }
                            });
                            inputEl = textInput;
                        }

                        // Reset Button
                        const resetBtn = document.createElement('button');
                        resetBtn.innerHTML = '<i class="fas fa-undo"></i>';
                        resetBtn.title = 'Reset to default';
                        resetBtn.className = 'dialog-btn dialog-btn-secondary';
                        resetBtn.style.padding = '4px 8px';
                        resetBtn.addEventListener('click', async () => {
                            await ide.settings.reset(key);
                            // Lazy UI refresh: ideally we'd listen to the EventBus, but here we manually update the node
                            const newVal = ide.settings.get(key) ?? prop.default;
                            if (prop.type === 'boolean') (inputEl as HTMLInputElement).checked = Boolean(newVal);
                            else (inputEl as HTMLInputElement).value = String(newVal);
                        });

                        inputWrapper.appendChild(inputEl);
                        inputWrapper.appendChild(resetBtn);

                        settingRow.appendChild(label);
                        settingRow.appendChild(description);
                        settingRow.appendChild(inputWrapper);
                        section.appendChild(settingRow);
                    });

                    container.appendChild(section);
                });

                // Listen to external configuration changes to keep UI in sync
                const subId = ide.commands.on('configuration.changed', (event: any) => {
                    // In a production app, you would target the specific input element and update it here
                    // to reflect settings changed via command palette or other extensions.
                });
                disposables.push({ dispose: () => ide.commands.off(subId) });
            }
        };

        // 2. Register the view in the center panel so it opens like a file tab
        ide.views.registerProvider('center-panel', settingsView);
        context.subscriptions.push({ dispose: () => ide.views.unregisterProvider('center-panel', settingsView.id) });

        // 3. Register the Command to open settings
        const openSettingsCmd = {
            id: 'settings.open',
            label: 'Preferences: Open Settings',
            keybinding: 'Ctrl+,', // Standard IDE shortcut for settings
            category: 'Preferences',
            handler: () => {
                ide.views.renderView('center-panel', settingsView.id);
            }
        };
        ide.commands.register(openSettingsCmd);
        context.subscriptions.push({ dispose: () => ide.commands.unregister(openSettingsCmd.id) });

        // 4. Bind the IDE event triggered from the Command Palette [cite: 749, 750]
        const legacyEventSub = ide.commands.on('ide:open_settings', () => {
            ide.commands.execute('settings.open');
        });
        context.subscriptions.push({ dispose: () => ide.commands.off(legacyEventSub) });

        // 5. Add a gear icon to the Activity Bar
        ide.activityBar.registerItem({
            id: settingsView.id,
            location: 'left-panel', // Place it at the bottom of the left sidebar like VS Code
            icon: 'fas fa-cog',
            title: 'Manage Settings',
            order: 9999,
            onClick: () => ide.commands.execute('settings.open')
        });
        context.subscriptions.push({ dispose: () => ide.activityBar.unregisterItem(settingsView.id) });
    }
}