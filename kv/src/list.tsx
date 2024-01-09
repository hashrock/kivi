/* eslint-disable @typescript-eslint/naming-convention */
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import React, { useEffect, useRef, useState } from "react";
import {
  Config,
  getConfig,
  KvKey,
  kvList,
  KvPair,
  showMessage,
  vscode,
} from "./api";
import { IconSearch, Spinner } from "./icons";
import { kvKeyToString, queryToKvPrefix } from "./utils";
import { Nav, NewItem } from "./nav";
import { PageType } from "./main";
import superjson from "superjson";

interface PageListFormProps {
  prefix: KvKey;
  onSubmit: (key: string) => void;
  isBusy: boolean;
}

function PageListForm(props: PageListFormProps) {
  const searchKeyRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchKeyRef.current === null) {
      return;
    }
    searchKeyRef.current.focus();
  }, [searchKeyRef]);

  const keyString = kvKeyToString(props.prefix);

  return (
    <form
      className="form__wrapper"
      onSubmit={(e) => {
        e.preventDefault();
        if (searchKeyRef.current === null) {
          return;
        }
        const searchKey = searchKeyRef.current.value;
        props.onSubmit(searchKey);
      }}
    >
      <input
        className="form__query"
        ref={searchKeyRef}
        type="text"
        placeholder="Search"
        defaultValue={keyString}
      />
      <button className="form__submit" type="submit">
        {props.isBusy
          ? <Spinner width={16} height={16} stroke="white" />
          : <IconSearch width={16} height={16} />}
      </button>
    </form>
  );
}

interface PageListResultItemProps {
  item: {
    key: KvKey;
    value: string;
  };
  onChangeSelectedKey: (key: KvKey) => void;
  previewValue?: boolean;
}
function PageListResultItem(props: PageListResultItemProps) {
  const item = props.item;

  return (
    <div
      className="result__item"
      onClick={() => {
        props.onChangeSelectedKey(item.key);
      }}
    >
      <div className="result__item__key">
        {
          <span className="result__item__key__strict">
            {item.key.map((i) => {
              const isString = typeof i === "string";
              return isString
                ? (
                  <span className="result__item__key__badge result__item__key__badge--string">
                    "{i}"
                  </span>
                )
                : (
                  <span className="result__item__key__badge">
                    {i.toString()}
                  </span>
                );
            })}
          </span>
        }
      </div>
      {props.previewValue && (
        <div className="result__item__value">
          {JSON.stringify(item.value)}
        </div>
      )}
    </div>
  );
}

interface PageListResultProps {
  items: KvPair[];
  onChangeSelectedKey: (key: KvKey) => void;
  previewValue?: boolean;
  onLoadMore: () => void;
  cursor: string | null;
}
function PageListResult(props: PageListResultProps) {
  const items = props.items;

  return (
    <div className="result">
      {items.length === 0 && (
        <div className="result__empty">
          No items found
        </div>
      )}
      {items.map((item) => (
        <PageListResultItem
          key={kvKeyToString(item.key)}
          item={item}
          onChangeSelectedKey={(key) => props.onChangeSelectedKey(key)}
          previewValue={props.previewValue}
        />
      ))}
      {props.cursor && (
        <button onClick={props.onLoadMore}>
          Load more
        </button>
      )}
    </div>
  );
}

interface PageListProps {
  database: string;
  onChangeSelectedKey: (key: KvKey) => void;
  prefix: KvKey;
  onChangePrefix: (prefix: KvKey) => void;
  onChangePage: (page: PageType) => void;
  config: Config;
}

function getExampleCode(selectedKey: KvKey) {
  return `const kv = await Deno.openKv();

const cur = kv.list({ prefix: ${JSON.stringify(selectedKey)}});
const result = [];

for await (const entry of cur) {
  console.log(entry.key); // ["preferences", "ada"]
  console.log(entry.value); // { ... }
  console.log(entry.versionstamp); // "00000000000000010000"
  result.push(entry);
}`;
}

export function PageList(props: PageListProps) {
  const [items, setItems] = useState<KvPair[]>([]);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const menus = [{
    title: "Copy code with kv.list",
    onClick: () => {
      navigator.clipboard.writeText(getExampleCode(props.prefix ?? []));
      showMessage("Copied!");
    },
  }, {
    title: "Export JSON",
    onClick: () => {
      const blob = new Blob([JSON.stringify(items, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kv.json";
      a.click();
    },
  }];

  async function loadMore(cursor: string | null) {
    const { result, cursor: cursorResult } = await kvList(
      props.prefix ?? [],
      props.config.listFetchSize,
      cursor ?? "",
    );
    setItems((prev) => [...prev, ...result]);
    setCursor(cursorResult);
  }

  useEffect(() => {
    setIsBusy(true);
    setItems([]);
    setCursor(null);
    (async () => {
      await loadMore(null);
      setIsBusy(false);
    })();
  }, [props.prefix]);

  return (
    <>
      <Nav onChangePage={props.onChangePage} menuItems={menus}>
        <div className="nav__title">
          Items
        </div>
        <NewItem
          onClick={() => props.onChangePage("new")}
        />
      </Nav>
      <div className="result__wrapper">
        <PageListForm
          isBusy={isBusy}
          prefix={props.prefix}
          onSubmit={(key) => {
            const parsed = queryToKvPrefix(key);
            props.onChangePrefix(parsed);
          }}
        />
        {items && (
          <PageListResult
            items={items}
            onChangeSelectedKey={(key) => {
              props.onChangeSelectedKey(key);
            }}
            previewValue={props.config.previewValue}
            cursor={cursor}
            onLoadMore={() => loadMore(cursor)}
          />
        )}
      </div>
    </>
  );
}
