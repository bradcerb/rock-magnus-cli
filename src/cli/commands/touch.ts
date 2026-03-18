import { Command } from "commander";
import { resolveServer, getClient } from "./shared.js";
import { withErrorHandler } from "./error-handler.js";
import pc from "picocolors";

export const touchCommand = new Command("touch")
  .description("Create a new file on the server")
  .argument("<new-file-uri>", "New file URI from the parent item descriptor")
  .argument("<name>", "Name of the file to create")
  .option("-s, --server <url>", "Server URL")
  .addHelpText("after", `
Examples:
  magnus touch /api/TriumphTech/Magnus/NewFile/Themes/MyTheme index.lava`)
  .action(withErrorHandler(async (newFileUri: string, name: string, opts: { server?: string }) => {
    const serverUrl = resolveServer(opts);
    const client = await getClient(serverUrl, opts);

    const result = await client.createFile(serverUrl, newFileUri, name);

    if (result.actionSuccessful) {
      console.log(pc.green(result.responseMessage || `File '${name}' created.`));
    } else {
      throw new Error(result.responseMessage || "Failed to create file.");
    }
  }));
