import * as React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { AuditLog } from "./types";
import AuditLogDetailDrawer from "./auditlog-detail-drawer";
import { getAuditRenderers } from "./auditlog-registrar";
import { defaultSummary, pickRenderer } from "./auditlog-registry";
import { useAuditLogInfinite } from "./use-auditlog-infinite";

export type AuditLogListInfiniteProps = {
  http: any;
  module?: string;
  targetId?: number;
  limit?: number;
};

export function AuditLogListInfinite({
  http,
  module,
  targetId,
  limit = 10,
}: AuditLogListInfiniteProps): React.ReactElement {
  const renderers = React.useMemo(() => getAuditRenderers(), []);
  const { items, hasMore, loading, error, loadMore, refresh } = useAuditLogInfinite(http, {
    module,
    target_id: targetId,
    limit,
  });
  const [selectedRow, setSelectedRow] = React.useState<AuditLog | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { root: null, rootMargin: "200px 0px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Audit Logs</Typography>
        <Button size="small" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      ) : null}

      <List disablePadding>
        {items.map((row) => {
          const renderer = pickRenderer(renderers, row);
          const summary = renderer.summary ? renderer.summary(row) : defaultSummary(row);

          return (
            <ListItem key={String(row.id)} disablePadding divider>
              <ListItemButton onClick={() => setSelectedRow(row)} sx={{ alignItems: "flex-start" }}>
                <ListItemText
                  primary={`${row.module}.${row.action}`}
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        Target: {row.target_id ?? "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(row.created_at).toLocaleString()}
                      </Typography>
                      <Box>{summary}</Box>
                    </Stack>
                  }
                  secondaryTypographyProps={{ component: "div" }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ pt: 1.5, textAlign: "center" }}>
        {loading ? <CircularProgress size={24} /> : null}

        {!loading && hasMore ? (
          <Button size="small" onClick={loadMore} sx={{ mt: 1 }}>
            Load more
          </Button>
        ) : null}

        {!hasMore ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            End of list
          </Typography>
        ) : null}
      </Box>

      <div ref={sentinelRef} />

      <AuditLogDetailDrawer
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
        renderers={renderers}
      />
    </Paper>
  );
}

export default AuditLogListInfinite;
