import * as React from "react";
import { Stack, Typography, Box } from "@mui/material";
import { SlotHost } from "@root/core/module/slot-host";

type PageToolbarProps = {
  key: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageToolbar({ key, title, subtitle, actions }: PageToolbarProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{ width: "100%", minWidth: 0 }}
    >
      <Box>
        <Typography variant="h5" fontWeight={700} textTransform={"capitalize"}>{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        )}
      </Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2.5}
      >
        <SlotHost direction="row" name="toolbar" />
        <SlotHost direction="row" name={`${key}:toolbar`} />
        {actions}
      </Stack>
    </Stack>
  );
}
