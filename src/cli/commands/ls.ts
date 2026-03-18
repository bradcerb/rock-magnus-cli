import { Command } from "commander";
import { resolveServer, getClient } from "./shared.js";
import { withErrorHandler } from "./error-handler.js";
import pc from "picocolors";
import type { ItemDescriptor } from "../../core/types.js";

export const lsCommand = new Command("ls")
  .description("List tree items at a path")
  .argument("[path]", "Path to list (omit for root)")
  .option("-s, --server <url>", "Server URL (uses default if omitted)")
  .option("-l, --long", "Show detailed output")
  .option("--json", "Output as JSON")
  .addHelpText("after", `
Examples:
  magnus ls
  magnus ls api/TriumphTech/Magnus/GetTreeItems/Themes
  magnus ls -l --json`)
  .action(withErrorHandler(async (path: string | undefined, opts: { server?: string; long?: boolean; json?: boolean }) => {
    const serverUrl = resolveServer(opts);
    const client = await getClient(serverUrl, opts);

    const items = await client.getChildItems(serverUrl, path);

    if (opts.json) {
      console.log(JSON.stringify(items, null, 2));
      return;
    }

    if (items.length === 0) {
      console.log("(empty)");
      return;
    }

    for (const item of items) {
      if (opts.long) {
        printLong(item);
      } else {
        const name = item.isFolder ? pc.bold(pc.blue(item.displayName)) : item.displayName;
        const icon = item.isFolder ? "dir" : "   ";
        console.log(`${icon}  ${name}`);
      }
    }
  }));

function printLong(item: ItemDescriptor): void {
  const type = item.isFolder ? pc.blue("dir ") : "file";
  const id = item.id ? `id:${item.id}` : "";
  const guid = item.guid ? `guid:${item.guid}` : "";
  const caps = [
    item.buildUri && "build",
    item.deleteUri && "delete",
    item.uploadFileUri && "upload",
    item.newFileUri && "newFile",
    item.newFolderUri && "newFolder",
  ].filter(Boolean).join(",");

  const name = item.isFolder ? pc.bold(pc.blue(item.displayName)) : item.displayName;
  console.log(`${type}  ${name.padEnd(40)} ${id.padEnd(12)} ${guid.padEnd(40)} [${caps}]`);
}
