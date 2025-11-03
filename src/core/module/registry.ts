import type { MenuItem, ModuleDescriptor, SlotConfig, SlotName } from "@core/module/types";
import { on } from "@core/module/event-bus";

type RegisteredModule = {
  meta: ModuleDescriptor;
  unsubscribers: Array<() => void>;
  slots: SlotConfig[];
  menu: MenuItem[];
};

const modules: Map<string, RegisteredModule> = new Map();
const slotRegistry = new Map<SlotName, SlotConfig[]>();
let menuCache: MenuItem[] | null = null;

export function registerModule(mod: ModuleDescriptor) {
  if (modules.has(mod.id)) {
    // tùy bạn: throw, warn, hoặc auto-unregister trước
    console.warn(`[module] duplicate id "${mod.id}" — overriding previous registration`);
    unregisterModule(mod.id);
  }

  const unsubscribers: Array<() => void> = [];

  // 1) Đăng ký slots
  const slots = [...(mod.slots ?? [])];
  for (const cfg of slots) {
    const arr = slotRegistry.get(cfg.name) ?? [];
    arr.push(cfg);
    arr.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    slotRegistry.set(cfg.name, arr);
  }

  // 2) Đăng ký event handlers (sync/async đều ok vì Handler hỗ trợ Promise)
  if (mod.onEvents) {
    for (const [evt, handler] of Object.entries(mod.onEvents)) {
      const off = on(evt, handler);
      unsubscribers.push(off);
    }
  }

  // 3) menu
  const menu = normalizeAndSortMenu(mod.menuItems ?? []);

  // 4) Lưu lại để có thể cleanup
  modules.set(mod.id, { meta: mod, unsubscribers, slots, menu });

  // invalidate cache
  menuCache = null;
}

/** Bỏ đăng ký module: gỡ slot + off handlers */
export function unregisterModule(id: string) {
  const reg = modules.get(id);
  if (!reg) return;

  // off events
  reg.unsubscribers.forEach((off) => {
    try { off(); } catch { /* noop */ }
  });

  // remove slots
  for (const cfg of reg.slots) {
    const arr = slotRegistry.get(cfg.name);
    if (!arr) continue;
    const next = arr.filter((x) => x !== cfg);
    if (next.length === 0) slotRegistry.delete(cfg.name);
    else slotRegistry.set(cfg.name, next);
  }

  modules.delete(id);

  // invalidate cache
  menuCache = null;
}

export function listRoutes() {
  const out: NonNullable<ModuleDescriptor["routes"]> = [];
  for (const { meta } of modules.values()) {
    if (meta.routes) out.push(...meta.routes);
  }
  return out;
}

export function listSlots(name: SlotName) {
  return slotRegistry.get(name) ?? [];
}

export function listMenuItems(): MenuItem[] {
  if (menuCache) return menuCache;
  const all: MenuItem[] = [];
  for (const { menu } of modules.values()) {
    if (menu?.length) all.push(...menu);
  }
  menuCache = sortMenu(all);
  return menuCache;
}

/** Optional: xem metadata emitEvents để tooling hiển thị */
export function listDeclaredEmitEvents() {
  const result: Record<string, string[]> = {};
  for (const { meta } of modules.values()) {
    if (meta.emitEvents && meta.emitEvents.length) {
      result[meta.id] = meta.emitEvents;
    }
  }
  return result;
}

function sortMenu(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pa !== pb) return pb - pa; // desc
    return (a.label ?? "").localeCompare(b.label ?? "");
  });
}

function cloneMenuItem(it: MenuItem): MenuItem {
  return {
    ...it,
    subItems: it.subItems?.map(cloneMenuItem),
  };
}

export function normalizeAndSortMenu(items: MenuItem[]): MenuItem[] {
  // tránh mutate input
  const cloned = items.map(cloneMenuItem);

  const walk = (arr: MenuItem[]): MenuItem[] => {
    const normalized = arr.map((it) => ({
      ...it,
      priority: it.priority ?? 0,
      subItems: it.subItems ? walk(it.subItems) : undefined,
    }));
    return sortMenu(normalized);
  };

  return walk(cloned);
}
