import { Chip, useMediaQuery } from "@mui/material";
import { theme } from "@root/app/theme";
import { formatBadgeCount } from "@root/shared/utils/badge.utils";

type NotifierChipProps = {
  count: number | null;
  collapsed?: boolean;
};

export function NotifierChip({ count, collapsed = false }: NotifierChipProps) {
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isCompact = collapsed;
  const badgeMax = isSmall ? 9 : 99;

  if (!count || count <= 0) return null;

  if (isCompact) {
    return (
      <Chip
        size="small"
        color="warning"
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          p: 0,
          "& .MuiChip-label": {
            display: "none",
          },
        }}
      />
    );
  }

  return (
    <Chip
      label={formatBadgeCount(count, badgeMax)}
      size="small"
      color="warning"
      sx={{ height: 20 }}
    />
  );
}
