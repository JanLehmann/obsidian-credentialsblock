# Obsidian CredentialsBlock Plugin

A compact and secure way to store and display credentials (login, passwords, URLs) directly within your Obsidian notes using a custom code block.

![Version](https://img.shields.io/github/v/release/JanLehmann/obsidian-credentialsblock?label=version)
![Obsidian Version](https://img.shields.io/badge/Obsidian-%3E%3D0.15.0-purple)

## Features

- **Custom Code Block:** Use ` ```passwordblock ` to render a structured credential view.
- **Fields:** Displays Name, URL (clickable), Login, and Password.
- **Security:** Passwords are masked by default (`••••••••`) and can be revealed with a toggle button.
- **Quick Copy:** One-click copy buttons for Login and Password fields (visible on hover).
- **Compact Design:** Optimized for minimal space usage within your notes.
- **Customizable:** Change labels (e.g., translate to German) and default masking behavior in the settings.
- **Smart Links:** URLs automatically become clickable links.

## Usage

Create a code block with the language `passwordblock`:

```text
```passwordblock
name: My Web Account
url: https://example.com
login: myuser@email.com
password: mysecretpassword
```
```

### Supported Keys (Case-Insensitive)
- `name:`
- `url:`
- `login:`, `user:`, `benutzer:`
- `password:`, `passwort:`

## Installation

### Manual Installation
1. Download the latest release (`main.js`, `manifest.json`, `styles.css`).
2. Create a folder named `credentialsblock` in your vault's `.obsidian/plugins/` directory.
3. Move the downloaded files into that folder.
4. Reload Obsidian and enable the plugin in **Settings > Community plugins**.

## Development

If you want to build the plugin yourself:

1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the TypeScript code.

## License

MIT
