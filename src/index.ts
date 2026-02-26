/**
 * SettingsEditorExtension – Visual settings editor that opens as a center-panel tab.
 *
 * Reads every ConfigurationNode from the ConfigurationRegistry and renders
 * typed form controls (checkbox, number, select, text) that write back
 * through ConfigurationService.update().
 */

import { Extension, ExtensionContext, ViewProvider, ConfigurationNode, ConfigurationProperty } from 'canvas-ide-core';

// ── Helpers ──────────────────────────────────────────────────

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function friendlyLabel(key: string): string {
    // 'editor.fontSize' → 'Font Size'
    const parts = key.split('.');
    const raw = parts[parts.length - 1];
    return raw.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

// ── Extension ────────────────────────────────────────────────

export const SettingsEditorExtension: Extension = {
    id: 'core.settingsEditor',
    name: 'Settings Editor',
    version: '1.0.0',

    activate(context: ExtensionContext) {
        const { ide } = context;

        // ── View Provider (renders inside center-panel tab) ──

        const settingsProvider: ViewProvider = {
            id: 'core.settingsEditor.view',
            name: 'Settings',

            resolveView(container: HTMLElement, disposables: { dispose: () => void }[]) {
                container.innerHTML = '';

                const wrapper = document.createElement('div');
                wrapper.className = 'settings-editor';
                // Make the wrapper take up remaining space in the flex container and scroll
                wrapper.style.flex = '1';
                wrapper.style.minHeight = '0';
                wrapper.style.overflowY = 'auto';
                container.appendChild(wrapper);

                // ── Header ─────────────────────────────────
                const header = document.createElement('div');
                header.className = 'settings-header';

                const title = document.createElement('h1');
                title.className = 'settings-title';
                title.textContent = 'Settings';
                header.appendChild(title);

                const subtitle = document.createElement('p');
                subtitle.className = 'settings-subtitle';
                subtitle.textContent = 'Manage your editor preferences. Changes are saved automatically.';
                header.appendChild(subtitle);

                // ── Search bar ─────────────────────────────
                const searchWrap = document.createElement('div');
                searchWrap.className = 'settings-search-wrap';
                const searchIcon = document.createElement('i');
                searchIcon.className = 'fas fa-search settings-search-icon';
                searchWrap.appendChild(searchIcon);

                const searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.placeholder = 'Search settings…';
                searchInput.className = 'settings-search';
                searchInput.id = 'settings-search';
                searchWrap.appendChild(searchInput);
                header.appendChild(searchWrap);

                // Reset All button
                const resetAll = document.createElement('button');
                resetAll.className = 'settings-reset-all';
                resetAll.innerHTML = '<i class="fas fa-undo"></i> Reset All';
                resetAll.title = 'Reset all settings to defaults';
                resetAll.addEventListener('click', async () => {
                    await ide.settings.resetAll();
                    // Re-render to reflect default values
                    settingsProvider.resolveView(container, disposables);
                    ide.notifications.notify('All settings reset to defaults', 'info');
                });
                header.appendChild(resetAll);

                wrapper.appendChild(header);

                // ── Sections ───────────────────────────────
                const sectionsWrap = document.createElement('div');
                sectionsWrap.className = 'settings-sections';

                const nodes: ConfigurationNode[] = ide.configurationRegistry.getAll();

                for (const node of nodes) {
                    const section = document.createElement('div');
                    section.className = 'settings-section';
                    section.dataset.sectionId = node.id;

                    const sectionTitle = document.createElement('h2');
                    sectionTitle.className = 'settings-section-title';
                    sectionTitle.innerHTML = `<i class="fas fa-chevron-down settings-section-chevron"></i> ${capitalize(node.title)}`;
                    section.appendChild(sectionTitle);

                    const sectionBody = document.createElement('div');
                    sectionBody.className = 'settings-section-body';

                    // Collapse / expand
                    sectionTitle.addEventListener('click', () => {
                        const isCollapsed = section.classList.toggle('collapsed');
                        sectionTitle.querySelector('.settings-section-chevron')!
                            .classList.toggle('collapsed', isCollapsed);
                    });

                    for (const [key, prop] of Object.entries(node.properties)) {
                        const row = buildSettingRow(key, prop, ide);
                        sectionBody.appendChild(row);
                    }

                    section.appendChild(sectionBody);
                    sectionsWrap.appendChild(section);
                }

                wrapper.appendChild(sectionsWrap);

                // ── Search filtering ───────────────────────
                searchInput.addEventListener('input', () => {
                    const q = searchInput.value.toLowerCase().trim();
                    const rows = sectionsWrap.querySelectorAll('.settings-row') as NodeListOf<HTMLElement>;
                    const sections = sectionsWrap.querySelectorAll('.settings-section') as NodeListOf<HTMLElement>;

                    for (const row of rows) {
                        const text = (row.dataset.key || '').toLowerCase() + ' ' +
                            (row.querySelector('.settings-row-label')?.textContent || '').toLowerCase() +
                            (row.querySelector('.settings-row-description')?.textContent || '').toLowerCase();
                        row.style.display = !q || text.includes(q) ? '' : 'none';
                    }

                    // Hide sections with all rows hidden
                    for (const sec of sections) {
                        const visibleRows = sec.querySelectorAll('.settings-row:not([style*="display: none"])');
                        sec.style.display = visibleRows.length === 0 && q ? 'none' : '';
                    }
                });
            },
        };

        // ── Build a single setting row ──────────────────────

        function buildSettingRow(
            key: string,
            prop: ConfigurationProperty,
            ideRef: typeof ide,
        ): HTMLElement {
            const row = document.createElement('div');
            row.className = 'settings-row';
            row.dataset.key = key;

            // Left side: label + description
            const info = document.createElement('div');
            info.className = 'settings-row-info';

            const label = document.createElement('div');
            label.className = 'settings-row-label';
            label.textContent = friendlyLabel(key);
            info.appendChild(label);

            const keyLabel = document.createElement('code');
            keyLabel.className = 'settings-row-key';
            keyLabel.textContent = key;
            info.appendChild(keyLabel);

            const desc = document.createElement('div');
            desc.className = 'settings-row-description';
            desc.textContent = prop.description;
            info.appendChild(desc);

            row.appendChild(info);

            // Right side: control
            const control = document.createElement('div');
            control.className = 'settings-row-control';

            const currentValue = ideRef.settings.get(key);

            switch (prop.type) {
                case 'boolean': {
                    const toggle = document.createElement('label');
                    toggle.className = 'settings-toggle';

                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.checked = currentValue as boolean;
                    cb.id = `setting-${key}`;
                    cb.addEventListener('change', async () => {
                        try {
                            await ideRef.settings.update(key, cb.checked);
                        } catch (err: any) {
                            ideRef.notifications.notify(err.message, 'error');
                            cb.checked = !cb.checked;
                        }
                    });

                    const slider = document.createElement('span');
                    slider.className = 'settings-toggle-slider';

                    toggle.appendChild(cb);
                    toggle.appendChild(slider);
                    control.appendChild(toggle);
                    break;
                }

                case 'number': {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'settings-input settings-input-number';
                    input.value = String(currentValue ?? prop.default);
                    input.id = `setting-${key}`;
                    input.addEventListener('change', async () => {
                        const v = parseFloat(input.value);
                        if (!isNaN(v)) {
                            try {
                                await ideRef.settings.update(key, v);
                            } catch (err: any) {
                                ideRef.notifications.notify(err.message, 'error');
                                input.value = String(ideRef.settings.get(key) ?? prop.default);
                            }
                        }
                    });
                    control.appendChild(input);
                    break;
                }

                case 'enum': {
                    const select = document.createElement('select');
                    select.className = 'settings-select';
                    select.id = `setting-${key}`;
                    for (const opt of prop.enum || []) {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt;
                        if (opt === currentValue) option.selected = true;
                        select.appendChild(option);
                    }
                    select.addEventListener('change', async () => {
                        try {
                            await ideRef.settings.update(key, select.value);
                        } catch (err: any) {
                            ideRef.notifications.notify(err.message, 'error');
                            select.value = String(ideRef.settings.get(key) ?? prop.default);
                        }
                    });
                    control.appendChild(select);
                    break;
                }

                case 'string':
                default: {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'settings-input';
                    input.value = String(currentValue ?? prop.default ?? '');
                    input.id = `setting-${key}`;
                    input.addEventListener('change', async () => {
                        try {
                            await ideRef.settings.update(key, input.value);
                        } catch (err: any) {
                            ideRef.notifications.notify(err.message, 'error');
                            input.value = String(ideRef.settings.get(key) ?? prop.default ?? '');
                        }
                    });
                    control.appendChild(input);
                    break;
                }
            }

            // Reset button per row
            const resetBtn = document.createElement('button');
            resetBtn.className = 'settings-row-reset';
            resetBtn.title = 'Reset to default';
            resetBtn.innerHTML = '<i class="fas fa-undo"></i>';
            resetBtn.addEventListener('click', async () => {
                await ideRef.settings.reset(key);
                // Update the control to reflect the default value
                const defaultVal = prop.default;
                const el = control.querySelector(`#setting-${CSS.escape(key)}`) as HTMLInputElement | HTMLSelectElement | null;
                if (el) {
                    if (el instanceof HTMLSelectElement) {
                        el.value = String(defaultVal);
                    } else if (el.type === 'checkbox') {
                        (el as HTMLInputElement).checked = defaultVal as boolean;
                    } else {
                        el.value = String(defaultVal);
                    }
                }
                ideRef.notifications.notify(`Reset "${key}" to default`, 'info', 3000);
            });
            control.appendChild(resetBtn);

            row.appendChild(control);
            return row;
        }

        // ── Register provider in center-panel ───────────────

        ide.views.registerProvider('center-panel', settingsProvider);

        // ── Open command ────────────────────────────────────

        const openSettingsCmd = ide.commands.registerDisposable({
            id: 'settings.open',
            label: 'Open Settings',
            keybinding: 'Ctrl+,',
            handler: () => {
                ide.views.renderView('center-panel', settingsProvider.id);
            },
        });
        context.subscriptions.push(openSettingsCmd);

        // ── Menu entry (under File) ─────────────────────────
        // We'll add a settings entry to the existing menu via the IDE
        ide.layout.header.menuBar.addMenuItem({
            id: 'settings-menu',
            label: 'Preferences',
            items: [
                {
                    id: 'settings-menu:open',
                    label: 'Settings',
                    shortcut: 'Ctrl+,',
                    icon: 'fas fa-cog',
                    onClick: () => ide.commands.execute('settings.open'),
                },
            ],
        });

        // ── Activity bar icon ───────────────────────────────
        ide.activityBar.registerItem({
            id: 'settings.activityBar',
            location: 'left-panel',
            icon: 'fas fa-cog',
            title: 'Settings',
            order: 999,
            onClick: () => ide.commands.execute('settings.open')
        });
    },
};