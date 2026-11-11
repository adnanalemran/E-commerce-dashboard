import React from "react";

export type MenuType = "main" | "support" | "others";

export interface SubItem {
  key: string;
  path: string;
  /** Only shown to users with one of these roles. */
  roles?: readonly string[];
  pro?: boolean;
  new?: boolean;
  target?: string;
}

export interface NavItem {
  key: string;
  icon: React.ReactNode;
  path?: string;
  /** Only shown to users with one of these roles. */
  roles?: readonly string[];
  new?: boolean;
  target?: string;
  subItems?: SubItem[];
}
