import * as vscode from "vscode";
import * as kvExtension from "./kv/extension";

export function activate(context: vscode.ExtensionContext) {
  kvExtension.activate(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
  kvExtension.deactivate();
}
