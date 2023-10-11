/* eslint-disable @typescript-eslint/naming-convention */
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import React, { useCallback, useEffect } from "react";
import { PageType } from "./main";
import { IconChevronLeft, IconDots, IconPlus } from "./icons";
import classnames from "classnames";
export function BackHome(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="nav__button nav__back-home"
      {...props}
    >
      <IconChevronLeft width={16} height={16} />
    </button>
  );
}

export function NewItem(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="nav__button nav__new-item"
      {...props}
    >
      <IconPlus width={16} height={16} />
    </button>
  );
}
export interface MenuItemProps {
  title: string;
  onClick: () => void;
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
  children?: React.ReactNode[] | React.ReactNode;
  menuItems: MenuItemProps[];
}

export function Nav(props: NavProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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

    return () => {
      document.removeEventListener("click", clickOutside);
      document.removeEventListener("keydown", onKeydown);
    };
  }, []);

  return (
    <div className="nav">
      {props.children}

      <Menu
        onClick={(ev) => {
          ev.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
      />

      <div
        className={classnames("nav__menu", isMenuOpen && "nav__menu--open")}
      >
        {props.menuItems.map((item) => (
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
