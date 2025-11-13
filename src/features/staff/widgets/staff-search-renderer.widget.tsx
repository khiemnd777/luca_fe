import { Box, Chip } from "@mui/material";
import { registerSearchRenderer, type SearchRenderer } from "@core/search";
import SearchItem, { ICONS } from "@root/core/search/search-item";
import { Badge } from "@shared/components/ui/badge";

const StaffSearchRenderer: SearchRenderer = (o, { highlight }) => (
  <SearchItem
    icon={ICONS.staff}
    title={highlight(o.title)}
    subtitle={
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {o.subtitle ? <span>{highlight(o.subtitle)}</span> : null}
        {o.keywords ? o.keywords.split("|").map((kw) => <Chip size="small" label={highlight(kw)} />) : null}
      </Box>
    }
    right={<Badge badge={{ avatar: o.attributes?.["avatar"] }} />}
  />
);

registerSearchRenderer("staff", StaffSearchRenderer);
