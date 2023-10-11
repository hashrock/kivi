/* eslint-disable @typescript-eslint/naming-convention */
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import React, { useCallback, useContext, useEffect, useState } from "react";
import { PageType } from "./main";
import { IconChevronLeft, IconDots, IconPlus } from "./icons";
import { MenuContext, MenuItemProps } from "./context";
import classnames from "classnames";
function BackHome(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="nav__button nav__back-home"
      {...props}
    >
      <IconChevronLeft width={16} height={16} />
    </button>
  );
}

function NewItem(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="nav__button nav__new-item"
      {...props}
    >
      <IconPlus width={16} height={16} />
    </button>
  );
}

function Menu(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="nav__button nav__openmenu"
      {...props}
    >
      <IconDots width={16} height={16} />
    </button>
  );
}

interface NavProps {
  page: PageType;
  onChangePage: (page: PageType) => void;
}

export function Nav(props: NavProps) {
  const { page } = props;

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const context = useContext(MenuContext);

  const clickOutside = useCallback((ev: MouseEvent) => {
    if (ev.target instanceof HTMLElement && ev.target.closest(".nav__menu")) {
      return;
    }
    setIsMenuOpen(false);
  }, []);

  const onKeydown = useCallback((ev: KeyboardEvent) => {
    if (ev.key === "Escape") {
      setIsMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", clickOutside);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("visibilitychange", () => {
      setIsMenuOpen(false);
    });
    return () => {
      document.removeEventListener("click", clickOutside);
      document.removeEventListener("keydown", onKeydown);
    };
  }, []);

  return (
    <div className="nav">
      {page === "single" && (
        <>
          <BackHome
            onClick={() => props.onChangePage("list")}
          />
          <div className="nav__title">
            Edit Item
          </div>
          <NewItem
            onClick={() => props.onChangePage("new")}
          />
        </>
      )}

      {page === "list" && (
        <>
          <div className="nav__title">
            Items
          </div>
          <NewItem
            onClick={() => props.onChangePage("new")}
          />
        </>
      )}

      {page === "new" && (
        <>
          <BackHome
            onClick={() => props.onChangePage("list")}
          />
          <div className="nav__title">
            New Item
          </div>
        </>
      )}

      <Menu
        onClick={(ev) => {
          ev.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
      />

      <div
        className={classnames("nav__menu", isMenuOpen && "nav__menu--open")}
      >
        {context.menuItems.map((item) => (
          <div
            className="nav__menu__item"
            onClick={() => {
              item.onClick();
              setIsMenuOpen(false);
            }}
          >
            {item.title}
          </div>
        ))}
      </div>
    </div>
  );
}
