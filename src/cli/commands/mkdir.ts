import { Command } from "commander";
import { resolveServer, getClient } from "./shared.js";
import { withErrorHandler } from "./error-handler.js";
import pc from "picocolors";

export const mkdirCommand = new Command("mkdir")
  .description("Create a new folder on the server")
  .argument("<new-folder-uri>", "New folder URI from the parent item descriptor")
  .argument("<name>", "Name of the folder to create")
  .option("-s, --server <url>", "Server URL")
  .addHelpText("after", `
Examples:
  magnus mkdir /api/TriumphTech/Magnus/NewFolder/Themes MyNewTheme`)
  .action(withErrorHandler(async (newFolderUri: string, name: string, opts: { server?: string }) => {
    const serverUrl = resolveServer(opts);
    const client = await getClient(serverUrl, opts);

    const result = await client.createFolder(serverUrl, newFolderUri, name);

    if (result.actionSuccessful) {
      console.log(pc.green(result.responseMessage || `Folder '${name}' created.`));
    } else {
      throw new Error(result.responseMessage || "Failed to create folder.");
    }
  }));
