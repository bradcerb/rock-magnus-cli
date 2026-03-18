# rock-magnus-cli

CLI for interacting with [Rock RMS](https://www.rockrms.com/) via the [Magnus](https://www.triumphtech.com/magnus) API. Provides filesystem-like commands to browse, read, write, and manage files on your Rock server.

## Installation

```bash
npm install -g rock-magnus-cli
```

Requires Node.js 20 or later.

## Quick Start

```bash
# Authenticate with your Rock server
magnus login https://rock.example.com

# List root items
magnus ls

# Read a file
magnus cat /Themes/MyTheme/Layouts/Site.lava

# Write a file
magnus write /Themes/MyTheme/Styles/theme.less -f theme.less

# Trigger a build
magnus build /api/TriumphTech/Magnus/Build/Themes/MyTheme
```

## Commands

| Command | Description |
|---------|-------------|
| `magnus login <url>` | Authenticate with a Rock RMS server |
| `magnus servers list` | List saved servers |
| `magnus servers default <url>` | Set the default server |
| `magnus servers remove <url>` | Remove a saved server and its credentials |
| `magnus ls [path]` | List tree items at a path |
| `magnus cat <path>` | Read and display a file |
| `magnus write <path>` | Write content to a file |
| `magnus build <uri>` | Trigger a build action |
| `magnus rm <uri>` | Delete a resource |
| `magnus mkdir <uri> <name>` | Create a folder |
| `magnus touch <uri> <name>` | Create a file |
| `magnus upload <uri> <paths...>` | Upload files or a directory |

### Global Options

- `--verbose` — Show HTTP request/response debug output
- `--version` — Show version number
- `--help` — Show help for any command

Run `magnus <command> --help` for detailed usage and examples.

## Configuration

Credentials are stored in plaintext at `~/.config/magnus-cli-secrets/config.json` (same approach as AWS CLI, gh CLI). Server configuration is at `~/.config/magnus-cli/config.json`. Authentication cookies are cached at `~/.config/magnus-cli-cookies/config.json` and expire after 24 hours.

Protect these files with appropriate filesystem permissions.

## Development

```bash
git clone https://github.com/bradleyerb/rock-magnus-cli.git
cd rock-magnus-cli
npm install
npm run build
npm run typecheck
npm test
```

## License

MIT
