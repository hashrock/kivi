export const vscode = acquireVsCodeApi();

export type KvKeyPart = Uint8Array | string | number | bigint | boolean;
export type KvKey = KvKeyPart[];
export type KvValue = unknown;

export function kvSet(key: KvKey, value: KvValue) {
  vscode.postMessage({ type: "set", key, value });
}

export function kvGet(key: KvKey) {
  vscode.postMessage({ type: "get", key });
}

// TODO
export function kvDelete(key: KvKey) {
  vscode.postMessage({ type: "delete", key });
}

export function kvList(key: KvKey) {
  vscode.postMessage({ type: "list", key });
}

export function kvRequestChangeDatabase() {
  vscode.postMessage({ type: "changeDatabase" });
}

export function showMessage(message: string) {
  vscode.postMessage({
    type: "message",
    message: message,
  });
}
