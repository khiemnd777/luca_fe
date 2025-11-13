import * as React from "react";
import type { SearchModel } from "./search.model";

export type SearchRenderCtx = {
  q: string;
  highlight: (text: string) => React.ReactNode;
};

export type SearchRenderer = (option: SearchModel, ctx: SearchRenderCtx) => React.ReactNode;

const registry = new Map<string, SearchRenderer>();

export function registerSearchRenderer(entityType: string, renderer: SearchRenderer) {
  registry.set(entityType, renderer);
}

export function getSearchRenderer(entityType: string): SearchRenderer | undefined {
  return registry.get(entityType);
}
