import type { ReactNode, LazyExoticComponent, JSX } from "react";
import type { Perm } from "@core/auth/rbac-utils";

export type SlotName = string;

export type SlotConfig = {
  id: string;
  name: SlotName;
  priority?: number;
  render: () => ReactNode;
};

export type RouteConfig = {
  path: string;
  element: ReactNode | LazyExoticComponent<() => JSX.Element>;
};

export type MenuItem = {
  key: string;                 
  label: string;
  to?: string;                      // đường dẫn (nếu là link)
  icon?: ReactNode;                 // <HomeRoundedIcon /> ...
  priority?: number;                // lớn hơn → render trước
  roles?: string[];
  requireAll?: boolean;             // mặc định false
  permissions?: Perm[];
  subItems?: MenuItem[];       
  extra?: Record<string, unknown>;  // metadata tuỳ ý
};

export type ModuleDescriptor = {
  id: string;
  routes?: RouteConfig[];
  slots?: SlotConfig[];
  /** Map sự kiện → handler (có thể sync hoặc async) */
  onEvents?: Record<string, (payload?: unknown) => void>;
  /** Danh sách tên sự kiện mà module *có thể* emit (metadata để tooling/docs) */
  emitEvents?: string[];
  menuItems?: MenuItem[];
};
