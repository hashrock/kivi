// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import * as vscode from "vscode";
import { KvViewProvider } from "./webview";
import { ChildProcess, spawn } from "child_process";

let process: ChildProcess | null = null;
let outputChannel: vscode.OutputChannel | null = null;

export function activate(context: vscode.ExtensionContext) {
  // create output channel
  outputChannel = vscode.window.createOutputChannel("kvViewer");
  context.subscriptions.push(outputChannel);
  outputChannel.appendLine("kvViewer activate");

  const workspaceRoute = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspaceRoute) {
    vscode.window.showErrorMessage("Please open a workspace");
    return;
  }

  const serverSrc = vscode.Uri.joinPath(
    context.extensionUri,
    "scripts",
    "kv",
    "server.ts",
  );

  process = spawn(
    "deno",
    ["run", "-A", "--unstable", serverSrc.path],
    {
      cwd: workspaceRoute,
    },
  );

  process?.stdout?.on("data", (data) => {
    // Example:
    // Listening on port 57168
    const text = data.toString();
    const match = text.match(/Listening on port (\d+)/);
    if (match) {
      const port = match[1];
      console.log("Server listening on port", port);

      const webviewProvider = new KvViewProvider(context.extensionUri, port);
      context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
          "hashrock.deno.kvView",
          webviewProvider,
        ),
      );
    }
    console.log(`Server stdout: ${data}`);
  });

  process?.stderr?.on("data", (data) => {
    console.error(`Server stderr: ${data}`);
  });

  process?.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

export function deactivate() {
  console.log("kvViewer deactivate");

  if (process) {
    process.kill();
    process = null;
  }
  if (outputChannel) {
    outputChannel.appendLine("kvViewer deactivate");
    outputChannel.dispose();
  }
}
