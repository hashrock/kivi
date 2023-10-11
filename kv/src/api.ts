export const vscode = acquireVsCodeApi();

export type KvKeyPart = Uint8Array | string | number | bigint | boolean;
export type KvKey = KvKeyPart[];
export type KvValue = unknown;

export interface KvPair {
  key: KvKey;
  value: string;
  versionstamp: string;
}

let id = 0;

export async function postMessageParent(type: string, body: object) {
  id++;

  return new Promise((resolve, reject) => {
    const timeoutSec = 5;
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

export function kvGet(key: KvKey): Promise<KvPair> {
  return postMessageParent("get", { key }) as Promise<KvPair>;
}

export function kvDelete(key: KvKey) {
  return postMessageParent("delete", { key });
}

export function kvList(key: KvKey): Promise<KvPair[]> {
  return postMessageParent("list", { key }) as Promise<KvPair[]>;
}

export function kvRequestChangeDatabase() {
  return postMessageParent("changeDatabase", {});
}

export function showMessage(message: string) {
  return postMessageParent("message", { message });
}
