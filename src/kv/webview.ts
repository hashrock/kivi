// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/* eslint-disable @typescript-eslint/naming-convention */

import * as vscode from "vscode";
import fetch from "node-fetch";
import superjson from "superjson";

export type KvKeyPart = Uint8Array | string | number | bigint | boolean;
export type KvKey = KvKeyPart[];

type MessageType =
  | "list"
  | "changeDatabase"
  | "get"
  | "set"
  | "delete";

interface ResponseJson {
  type: MessageType;
  result: unknown;
  database?: string;
}

export class KvViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _port: string,
  ) {}
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken,
  ): void | Thenable<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,

      localResourceRoots: [
        this._extensionUri,
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      const type = data.type; // list, get, set, delete/ database
      const key = data.key;
      const value = data.value;
      const database = data.database;
      const id = data.id;

      if (type === "message") {
        vscode.window.showInformationMessage(data.message);
        return;
      }

      const url = `http://localhost:${this._port}/`;

      const requestJson = {
        type,
        key,
        value,
        database,
      };

      if (type === "changeDatabase") {
        const db = await vscode.window.showInputBox({
          prompt:
            "Enter KV database file path / URL / UUID (Empty to use default))",
          value: database,
        });
        if (db === undefined) {
          return;
        } else {
          // URL form is :
          // https://api.deno.com/databases/[UUID]/connect

          const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
          if (uuidRegex.test(db)) {
            requestJson.database =
              `https://api.deno.com/databases/${db}/connect`;
          } else {
            requestJson.database = db;
          }
        }
      }

      const response = await fetch(url, {
        method: "POST",
        body: superjson.stringify(requestJson),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        vscode.window.showErrorMessage(`KV Viewer: ${response.statusText}`);
        return;
      }
      const result = superjson.parse<ResponseJson>(await response.text());

      if (type === "list") {
        webviewView.webview.postMessage({
          id,
          type: "listResult",
          result: result,
        });
      }
      if (type === "set") {
        webviewView.webview.postMessage({
          id,
          type: "setResult",
          result: result.result,
        });
      }
      if (type === "get") {
        webviewView.webview.postMessage({
          id,
          type: "getResult",
          result: result,
        });
      }
      if (type === "delete") {
        webviewView.webview.postMessage({
          id,
          type: "deleteResult",
          result: result.result,
        });
      }
      if (type === "changeDatabase") {
        webviewView.webview.postMessage({
          id,
          type: "changeDatabaseResult",
          result: requestJson.database,
        });
      }
      if (type === "message") {
        webviewView.webview.postMessage({
          id,
          type: "messageResult",
          result: "OK",
        });
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const subFolder = "kv";
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        subFolder,
        "main.js",
      ),
    );

    // Do the same for the stylesheet.
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        subFolder,
        "vscode.css",
      ),
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        subFolder,
        "main.css",
      ),
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Fresh URL Matcher</title>
			</head>
			<body>
        <div id="app">
        </div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
