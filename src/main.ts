import { Plugin, MarkdownRenderChild, setIcon, Notice, PluginSettingTab, App, Setting, MarkdownView } from 'obsidian';

interface PasswordData {
	name?: string;
	url?: string;
	ip?: string;
	login?: string;
	password?: string;
}

interface PasswordBlockSettings {
	maskPasswordByDefault: boolean;
	showRibbonIcon: boolean;
	labelName: string;
	labelUrl: string;
	labelIp: string;
	labelLogin: string;
	labelPassword: string;
}

const DEFAULT_SETTINGS: PasswordBlockSettings = {
	maskPasswordByDefault: true,
	showRibbonIcon: true,
	labelName: 'Name',
	labelUrl: 'URL',
	labelIp: 'IP',
	labelLogin: 'Login',
	labelPassword: 'Password'
}

export default class CredentialsBlockPlugin extends Plugin {
	settings!: PasswordBlockSettings;
	ribbonIconEl: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new CredentialsBlockSettingTab(this.app, this));

		this.refreshRibbonIcon();

		const processor = (source: string, el: HTMLElement, ctx: any) => {
			const rows = source.split("\n").filter((row) => row.includes(":"));
			const data: PasswordData = {};

			rows.forEach((row) => {
				const [key, ...valueParts] = row.split(":");
				const value = valueParts.join(":").trim();
				const k = key.trim().toLowerCase();
				if (k === "name") data.name = value;
				if (k === "url") data.url = value;
				if (k === "ip" || k === "host" || k === "server") data.ip = value;
				if (k === "login" || k === "user" || k === "benutzer") data.login = value;
				if (k === "password" || k === "passwort") data.password = value;
			});

			ctx.addChild(new CredentialsBlock(el, data, this.settings));
		};

		this.registerMarkdownCodeBlockProcessor("passwordblock", processor);
		this.registerMarkdownCodeBlockProcessor("credentialsblock", processor);

		// Add command to command palette (and slash menu)
		this.addCommand({
			id: 'insert-credentials-block',
			name: 'Insert Credentials Block',
			editorCallback: (editor) => {
				const template = "```credentialsblock\nname: \nurl: \nip: \nlogin: \npassword: \n```";
				editor.replaceSelection(template);
				// Move cursor to after 'name: '
				const cursor = editor.getCursor();
				editor.setCursor({ line: cursor.line - 6, ch: 6 });
			}
		});

		// Add right-click menu item
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				menu.addItem((item) => {
					item
						.setTitle("Insert Credentials Block")
						.setIcon("lock")
						.onClick(async () => {
							const template = "```credentialsblock\nname: \nurl: \nip: \nlogin: \npassword: \n```";
							editor.replaceSelection(template);
							const cursor = editor.getCursor();
							editor.setCursor({ line: cursor.line - 6, ch: 6 });
						});
				});
			})
		);
	}

	refreshRibbonIcon() {
		if (this.settings.showRibbonIcon) {
			if (!this.ribbonIconEl) {
				this.ribbonIconEl = this.addRibbonIcon('key', 'Insert Credentials Block', (evt: MouseEvent) => {
					const view = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (view) {
						const editor = view.editor;
						const template = "```credentialsblock\nname: \nurl: \nip: \nlogin: \npassword: \n```";
						editor.replaceSelection(template);
						const cursor = editor.getCursor();
						editor.setCursor({ line: cursor.line - 6, ch: 6 });
					} else {
						new Notice('Please open a Markdown file first.');
					}
				});
			}
		} else {
			if (this.ribbonIconEl) {
				this.ribbonIconEl.remove();
				this.ribbonIconEl = null;
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		// Clean up anything not automatically handled by Obsidian
		console.log('Unloading CredentialsBlock plugin');
	}
}

class CredentialsBlock extends MarkdownRenderChild {
	data: PasswordData;
	settings: PasswordBlockSettings;

	constructor(containerEl: HTMLElement, data: PasswordData, settings: PasswordBlockSettings) {
		super(containerEl);
		this.data = data;
		this.settings = settings;
	}

	onload() {
		this.containerEl.empty();
		const root = this.containerEl.createDiv({ cls: "password-block-container" });

		if (this.data.name) {
			this.createRow(root, this.settings.labelName, this.data.name, false, false);
		}
		if (this.data.url) {
			this.createRow(root, this.settings.labelUrl, this.data.url, true, false);
		}
		if (this.data.ip) {
			this.createRow(root, this.settings.labelIp, this.data.ip, false, true);
		}
		if (this.data.login) {
			this.createRow(root, this.settings.labelLogin, this.data.login, false, true);
		}
		if (this.data.password) {
			this.createPasswordRow(root, this.settings.labelPassword, this.data.password);
		}
	}

	createRow(parent: HTMLElement, label: string, value: string, isUrl: boolean = false, showCopy: boolean = true) {
		const row = parent.createDiv({ cls: "pb-row" });
		row.createDiv({ cls: "pb-label", text: label });
		
		const valueContainer = row.createDiv({ cls: "pb-value-container" });
		if (isUrl) {
			const link = valueContainer.createEl("a", { 
				cls: "pb-value pb-link", 
				text: value,
				href: value.startsWith("http") ? value : `https://${value}` 
			});
		} else {
			valueContainer.createDiv({ cls: "pb-value", text: value });
		}

		if (showCopy) {
			const copyBtn = row.createDiv({ cls: "pb-copy-btn" });
			setIcon(copyBtn, "copy");
			copyBtn.onclick = () => {
				navigator.clipboard.writeText(value);
				new Notice(`Copied ${label} to clipboard`);
			};
		}
	}

	createPasswordRow(parent: HTMLElement, label: string, value: string) {
		const row = parent.createDiv({ cls: "pb-row" });
		row.createDiv({ cls: "pb-label", text: label });

		const valueContainer = row.createDiv({ cls: "pb-value-container" });
		
		let visible = !this.settings.maskPasswordByDefault;
		const maskChar = "••••••••";
		const valueEl = valueContainer.createDiv({ 
			cls: "pb-value pb-password", 
			text: visible ? value : maskChar 
		});

		const actions = row.createDiv({ cls: "pb-actions" });

		const showBtn = actions.createDiv({ cls: "pb-show-btn" });
		setIcon(showBtn, visible ? "eye-off" : "eye");

		showBtn.onclick = () => {
			visible = !visible;
			valueEl.setText(visible ? value : maskChar);
			setIcon(showBtn, visible ? "eye-off" : "eye");
		};

		const copyBtn = actions.createDiv({ cls: "pb-copy-btn" });
		setIcon(copyBtn, "copy");
		copyBtn.onclick = () => {
			navigator.clipboard.writeText(value);
			new Notice(`Copied ${label} to clipboard`);
		};
	}
}

class CredentialsBlockSettingTab extends PluginSettingTab {
	plugin: CredentialsBlockPlugin;

	constructor(app: App, plugin: CredentialsBlockPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for CredentialsBlock'});

		new Setting(containerEl)
			.setName('Show Ribbon Icon')
			.setDesc('Toggle the key icon in the left side bar.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showRibbonIcon)
				.onChange(async (value) => {
					this.plugin.settings.showRibbonIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcon();
				}));

		new Setting(containerEl)
			.setName('Mask password by default')
			.setDesc('If enabled, passwords will be shown as dots by default.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.maskPasswordByDefault)
				.onChange(async (value) => {
					this.plugin.settings.maskPasswordByDefault = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', {text: 'Labels'});

		new Setting(containerEl)
			.setName('Name Label')
			.addText(text => text
				.setPlaceholder('Name')
				.setValue(this.plugin.settings.labelName)
				.onChange(async (value) => {
					this.plugin.settings.labelName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('URL Label')
			.addText(text => text
				.setPlaceholder('URL')
				.setValue(this.plugin.settings.labelUrl)
				.onChange(async (value) => {
					this.plugin.settings.labelUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('IP Label')
			.addText(text => text
				.setPlaceholder('IP')
				.setValue(this.plugin.settings.labelIp)
				.onChange(async (value) => {
					this.plugin.settings.labelIp = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Login Label')
			.addText(text => text
				.setPlaceholder('Login')
				.setValue(this.plugin.settings.labelLogin)
				.onChange(async (value) => {
					this.plugin.settings.labelLogin = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Password Label')
			.addText(text => text
				.setPlaceholder('Password')
				.setValue(this.plugin.settings.labelPassword)
				.onChange(async (value) => {
					this.plugin.settings.labelPassword = value;
					await this.plugin.saveSettings();
				}));
	}
}
