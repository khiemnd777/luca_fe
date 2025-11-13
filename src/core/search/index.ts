import DefaultRenderer from "@core/search/default-renderer";
import { registerSearchRenderer } from "@core/search/search-renderer";

registerSearchRenderer("__default__", DefaultRenderer);

export * from "@core/search/search-renderer";