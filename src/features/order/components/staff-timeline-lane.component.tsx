import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { OrderItemProcessInProgressProcessModel } from "@features/order/model/order-item-process-inprogress-process.model";
import { StaffTimelineBlock } from "@features/order/components/staff-timeline-block.component";

export type StaffTimelineLaneProps = {
  laneName: string;
  items: OrderItemProcessInProgressProcessModel[];
  rangeStart: Date;
  rangeEnd: Date;
  gridCount: number;
  gridType: "hour" | "day";
  onBlockClick?: (item: OrderItemProcessInProgressProcessModel) => void;
};

export function StaffTimelineLane({
  laneName,
  items,
  rangeStart,
  rangeEnd,
  gridCount,
  gridType,
  onBlockClick,
}: StaffTimelineLaneProps) {
  const background = gridCount > 1
    ? "repeating-linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.06) 1px, transparent 1px, transparent)"
    : undefined;

  const backgroundSize = gridCount > 1
    ? `${100 / gridCount}% 100%`
    : undefined;

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Typography
        variant="body2"
        fontWeight={600}
        color="text.secondary"
        sx={{ minWidth: 140 }}
      >
        {laneName || "Process"}
      </Typography>
      <Box
        data-grid-type={gridType}
        sx={{
          position: "relative",
          flex: 1,
          height: 34,
          borderRadius: 1,
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundImage: background,
          backgroundSize,
          overflow: "hidden",
        }}
      >
        {items.map((item) => (
          <StaffTimelineBlock
            key={`${item.id ?? "tmp"}-${item.startedAt}-${item.completedAt}`}
            item={item}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onClick={onBlockClick}
          />
        ))}
      </Box>
    </Stack>
  );
}
