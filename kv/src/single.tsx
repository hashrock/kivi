/* eslint-disable @typescript-eslint/naming-convention */
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import React, { useCallback, useContext, useEffect, useState } from "react";
import { kvDelete, kvGet, KvKey, kvSet } from "./api";
import { MenuContext } from "./context";
import { queryToKvPrefix } from "./utils";

type ValueType = "string" | "json" | "number";

interface valueCheckResult {
  isValid: boolean;
  reason: string;
}

interface PageSingleProps {
  selectedKey?: KvKey;
  isNewItem?: boolean;
  onSaveNewItem?: (key: KvKey, value: unknown) => void;
}
export function PageSingle(props: PageSingleProps) {
  const [selectedKey, setSelectedKey] = useState<KvKey | undefined>(
    props.selectedKey,
  );
  const [value, setValue] = useState<string | null>(null);
  const [isNewItem, setIsNewItem] = useState<boolean>(props.isNewItem || false);
  const [newKey, setNewKey] = useState<KvKey | undefined>(props.selectedKey);
  const [versionstamp, setVersionstamp] = useState<string | null>(null);
  interface Message {
    message: string;
    level: "success" | "info" | "error";
  }

  const [message, setMessage] = useState<Message | null>(null);
  const [valueType, setValueType] = useState<ValueType>("string");

  const isValidValueType = (value: unknown): valueCheckResult => {
    if (valueType === "string") {
      return {
        isValid: true,
        reason: "string is always valid",
      };
    }
    if (valueType === "number") {
      if (value === null || value === undefined) {
        return {
          isValid: false,
          reason: "number cannot be null",
        };
      }
      if (Number.isNaN(parseFloat(value as string))) {
        return {
          isValid: false,
          reason: "invalid number",
        };
      }
      return {
        isValid: true,
        reason: "OK",
      };
    }
    if (valueType === "json") {
      if (value === null) {
        return {
          isValid: false,
          reason: "json cannot be null",
        };
      }
      try {
        JSON.parse(value as string);
      } catch (e) {
        return {
          isValid: false,
          reason: "invalid json",
        };
      }
      return {
        isValid: true,
        reason: "OK",
      };
    }
    return {
      isValid: false,
      reason: "unknown valueType",
    };
  };

  useEffect(() => {
    if (selectedKey) {
      kvGet(selectedKey).then((result) => {
        const value = result.value;
        let valueType: ValueType = "string";
        if (typeof value === "object") {
          valueType = "json";
          setValue(JSON.stringify(value, null, 2));
        } else if (typeof value === "number") {
          valueType = "number";
          setValue(String(value));
        } else {
          setValue(value);
        }
        setValueType(valueType);
        setVersionstamp(result.versionstamp);
      });
    }
  }, [selectedKey]);

  const context = useContext(MenuContext);

  useEffect(() => {
    const getExample = `const db = Deno.openKv();

const res = await kv.get<string>([${JSON.stringify(newKey || [])}]);
console.log(res); // value`;

    const setExample = `const db = Deno.openKv();

const res = await kv.set(${JSON.stringify(newKey || [])}, ${value || ""});
console.log(res.versionstamp);`;

    context.setMenuItems([
      {
        title: "Delete this item",
        onClick: async () => {
          if (!selectedKey) {
            return;
          }
          const result = await kvDelete(selectedKey);
          if (result === "OK") {
            setMessage({
              message: "The item deleted successfully : " + new Date(),
              level: "success",
            });
          }
        },
      },
      {
        title: "Copy code with kv.get",
        onClick: () => {
          navigator.clipboard.writeText(getExample);
        },
      },
      {
        title: "Copy code with kv.set",
        onClick: () => {
          navigator.clipboard.writeText(setExample);
        },
      },
    ]);
  }, [newKey, value, selectedKey]);

  return (
    <div className="single__wrapper">
      <div className="label">
        Key
        <span className="doc">
          <a href="https://docs.deno.com/kv/manual/key_space#keys">doc</a>
        </span>
      </div>

      <div className="single__key">
        <textarea
          className="single__key__textarea"
          placeholder='key1,key2 or ["key1", "key2"]'
          rows={1}
          value={JSON.stringify(selectedKey)}
          onChange={(e) => {
            const value = e.target.value;
            return setNewKey(queryToKvPrefix(value));
          }}
          readOnly={!isNewItem}
        />
      </div>
      {versionstamp && (
        <div>
          <div className="label">
            VersionStamp
            <span className="doc">
              <a href="https://docs.deno.com/kv/manual/key_space#versionstamp">
                doc
              </a>
            </span>
          </div>
          <div className="single__versionstamp">{versionstamp}</div>
        </div>
      )}

      <div className="single__value">
        <div className="value-column">
          <div className="label">
            Value
            <span className="doc">
              <a href="https://docs.deno.com/kv/manual/key_space#values">
                doc
              </a>
            </span>
          </div>
          <select
            className="single__value__type"
            onChange={(e) => {
              setValueType(e.target.value as ValueType);
            }}
            value={valueType}
          >
            <option value="string">string</option>
            <option value="json">json</option>
            <option value="number">number</option>
          </select>
        </div>
        <div className="single__value__wrapper">
          <textarea
            className="single__value__textarea"
            placeholder="string, number or json"
            value={value || ""}
            onChange={(e) => {
              if (e.target.value !== value) {
                return setValue(e.target.value);
              }
            }}
          />
        </div>

        <div className="single__value-checker">
          {isValidValueType(value).isValid ? "" : (
            `❌ ${isValidValueType(value).reason}`
          )}
        </div>
      </div>
      <button
        className="single__update"
        onClick={async () => {
          if (!newKey) {
            setMessage({ message: "Key is empty", level: "error" });
            return;
          }
          if (!isValidValueType(value).isValid) {
            setMessage({
              message: isValidValueType(value).reason,
              level: "error",
            });
            return;
          }
          setSelectedKey(newKey);
          try {
            if (value !== null) {
              const result = await kvSet(
                newKey,
                kvConvertSetWithType(value, valueType),
              );
              if (result === "OK") {
                setMessage({
                  message: "The item set successfully : " + new Date(),
                  level: "success",
                });
              }
              const kvGetResult = await kvGet(newKey);
              if (kvGetResult) {
                setValue(JSON.stringify(kvGetResult.value, null, 2));
                setVersionstamp(kvGetResult.versionstamp);
              }
            }
          } catch (e) {
            if (e instanceof Error) {
              setMessage({ message: e.message, level: "error" });
            }
          }
        }}
      >
        {isNewItem ? "Create" : "Update"}
      </button>
      {message && (
        <div className={`message message--${message.level}`}>
          <div className="label">{message?.message}</div>
        </div>
      )}
    </div>
  );

  function kvConvertSetWithType(value: string, valueType: ValueType) {
    if (valueType === "string") {
      return value;
    } else if (valueType === "number") {
      return Number(value);
    } else if (valueType === "json" && value) {
      return JSON.parse(value);
    } else {
      throw new Error("unknown type");
    }
  }
}
