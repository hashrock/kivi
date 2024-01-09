export const vscode = acquireVsCodeApi();

import superjson from "superjson";
export type KvKeyPart = Uint8Array | string | number | bigint | boolean;
export type KvKey = KvKeyPart[];
export type KvValue = unknown;

export interface KvPair {
  key: KvKey;
  value: string;
  versionstamp: string;
}

export interface Config {
  previewValue: boolean;
  listFetchSize: number;
}

let id = 0;

export async function postMessageParent(type: string, body: object) {
  id++;

  return new Promise((resolve, reject) => {
    const timeoutSec = 60; // TODO databaseChange will timeout but user may still pending to select database
    const onTimedout = setTimeout(() => {
      reject(`Timeout: ${timeoutSec} seconds.`);
    }, timeoutSec * 1000);

    const handler = (event: MessageEvent) => {
      // eslint-disable-next-line curly
      if (event.data.id !== id) return;

      window.removeEventListener("message", handler);
      clearTimeout(onTimedout);
      resolve(event.data.result);
    };
    window.addEventListener("message", handler);
    vscode.postMessage({
      type,
      id,
      ...body,
      source: "webview",
    });
  });
}

export function kvSet(key: KvKey, value: KvValue) {
  return postMessageParent("set", { key, value });
}

export async function kvGet(key: KvKey): Promise<KvPair> {
  const resultStr = await (postMessageParent("get", { key })) as string;
  return superjson.parse(resultStr);
}

export function kvDelete(key: KvKey) {
  return postMessageParent("delete", { key });
}

export async function kvList(key: KvKey): Promise<KvPair[]> {
  const resultStr = await (postMessageParent("list", { key })) as string;
  return superjson.parse(resultStr);
}

export function kvRequestChangeDatabase() {
  // null is cancel
  return postMessageParent("changeDatabase", {}) as Promise<string | null>;
}

export function showMessage(message: string) {
  return postMessageParent("message", { message });
}

export async function getConfig() {
  const resultStr =
    await (postMessageParent("getConfig", {}) as Promise<string>);
  return JSON.parse(resultStr);
}
