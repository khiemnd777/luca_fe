import { type SearchRenderer } from "@core/search/search-renderer";
import SearchItem, { ICONS } from "./search-item";
import { HelpOutlineRounded } from "@mui/icons-material";

const DefaultRenderer: SearchRenderer = (o, { highlight }) => (
  <SearchItem
    icon={ICONS[o.entityType] ?? <HelpOutlineRounded color="disabled" />}
    title={highlight(o.title)}
    subtitle={o.subtitle ? highlight(o.subtitle) : null}
  />
);

export default DefaultRenderer;