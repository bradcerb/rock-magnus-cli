import { Command } from "commander";
import { getServers, getDefaultServer, setDefaultServer, removeServer, deleteCredentials, clearCachedCookie } from "../../core/auth.js";
import pc from "picocolors";

export const serversCommand = new Command("servers")
  .description("Manage saved servers")
  .addHelpText("after", `
Examples:
  magnus servers list
  magnus servers default https://rock.example.com
  magnus servers remove https://rock.example.com`);

serversCommand
  .command("list")
  .description("List all saved servers")
  .action(() => {
    const servers = getServers();
    const defaultUrl = getDefaultServer();

    if (servers.length === 0) {
      console.log("No servers configured. Run: magnus login <url>");
      return;
    }

    for (const s of servers) {
      const marker = s.url === defaultUrl ? pc.cyan(" (default)") : "";
      console.log(`  ${pc.bold(s.url)}  [${s.username}]${marker}`);
    }
  });

serversCommand
  .command("default")
  .description("Set the default server")
  .argument("<server-url>", "Server URL to set as default")
  .action((serverUrl: string) => {
    setDefaultServer(serverUrl);
    console.log(pc.green("Default server set."));
  });

serversCommand
  .command("remove")
  .description("Remove a saved server")
  .argument("<server-url>", "Server URL to remove")
  .action((serverUrl: string) => {
    removeServer(serverUrl);
    deleteCredentials(serverUrl);
    clearCachedCookie(serverUrl);
    console.log(pc.green("Server removed."));
  });
