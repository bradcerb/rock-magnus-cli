import { Command } from "commander";
import { createInterface } from "node:readline/promises";
import { resolveServer, getClient } from "./shared.js";
import { withErrorHandler } from "./error-handler.js";
import pc from "picocolors";

export const rmCommand = new Command("rm")
  .description("Delete a resource on the server")
  .argument("<delete-uri>", "Delete URI from the item descriptor")
  .option("-s, --server <url>", "Server URL")
  .option("-y, --yes", "Skip confirmation")
  .addHelpText("after", `
Examples:
  magnus rm /api/TriumphTech/Magnus/Delete/Themes/MyTheme/file.txt
  magnus rm /api/TriumphTech/Magnus/Delete/Themes/MyTheme/file.txt -y`)
  .action(withErrorHandler(async (deleteUri: string, opts: { server?: string; yes?: boolean }) => {
    const serverUrl = resolveServer(opts);

    if (!opts.yes) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await rl.question(`Delete ${deleteUri}? [y/N] `);
      rl.close();
      if (answer.toLowerCase() !== "y") {
        console.log("Cancelled.");
        return;
      }
    }

    const client = await getClient(serverUrl, opts);
    const result = await client.deleteResource(serverUrl, deleteUri);

    if (result.actionSuccessful) {
      console.log(pc.green(result.responseMessage || "Deleted."));
    } else {
      throw new Error(result.responseMessage || "Delete failed.");
    }
  }));
