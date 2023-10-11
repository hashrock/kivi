/* eslint-disable @typescript-eslint/naming-convention */
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import React, { useState } from "react";
import { render } from "react-dom";
import { PageList } from "./list";
import { PageSingle } from "./single";
import { IconDatabase } from "./icons";
import { KvKey, kvRequestChangeDatabase } from "./api";
import { CSSTransition } from "react-transition-group";

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

export type PageType = "list" | "new" | "single";

(function () {
  interface DatabaseProps {
    database: string;
    onChangeDatabase: (database: string) => void;
  }

  function Database(props: DatabaseProps) {
    const { database } = props;
    let databaseName = "Default database";

    if (database.startsWith("https://api.deno.com/databases/")) {
      databaseName = "Remote database";
    }

    return (
      <div
        className="database__wrapper"
        onClick={async () => {
          const result = await kvRequestChangeDatabase();
          if (result === null) {
            console.log("User cancelled database change");
          }
          if (result !== null) {
            props.onChangeDatabase(result);
          }
        }}
      >
        <IconDatabase width={16} height={16} />
        <div className="database">
          {databaseName}
        </div>
      </div>
    );
  }

  function Page() {
    const [page, setPage] = useState<PageType>("list");
    const [prefix, setPrefix] = useState<KvKey>([]);
    const [selectedKey, setSelectedKey] = useState<KvKey>([]);
    const [database, setDatabase] = useState<string>("");

    const showModal = page === "new" || page === "single";

    return (
      <div className="page">
        {page === "list" && (
          <PageList
            prefix={prefix}
            database={database}
            // will re-render when database changes
            key={database}
            onChangeSelectedKey={(key) => {
              setSelectedKey(key);
              setPage("single");
            }}
            onChangePrefix={(prefix) => {
              setPrefix(prefix);
            }}
            onChangePage={(page) => setPage(page)}
          />
        )}
        <CSSTransition in={showModal} timeout={300} classNames="modal">
          <div className="modal">
            {page === "new" && (
              <PageSingle
                isNewItem
                page="new"
                onChangePage={(page) => setPage(page)}
                onSaveNewItem={(key, value) => {
                  setSelectedKey(key);
                  setPage("single");
                }}
              />
            )}
            {page === "single" && (
              <PageSingle
                onChangePage={(page) => setPage(page)}
                page="single"
                selectedKey={selectedKey}
              />
            )}
          </div>
        </CSSTransition>
        <Database
          database={database}
          onChangeDatabase={(result) => {
            setDatabase(result);
          }}
        />
      </div>
    );
  }

  render(
    <Page />,
    document.getElementById("app"),
  );
})();
