import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import type { OrderItemProcessInProgressProcessModel } from "@features/order/model/order-item-process-inprogress-process.model";
import { durationSec } from "@features/order/components/staff-timeline.utils";

export type StaffTimelineBlockProps = {
  item: OrderItemProcessInProgressProcessModel;
  rangeStart: Date;
  rangeEnd: Date;
  onClick?: (item: OrderItemProcessInProgressProcessModel) => void;
};

export function StaffTimelineBlock({ item, rangeStart, rangeEnd, onClick }: StaffTimelineBlockProps) {
  if (!item.startedAt || !item.completedAt) return null;

  const rangeSec = Math.max(1, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 1000));
  const startSec = Math.round((new Date(item.startedAt).getTime() - rangeStart.getTime()) / 1000);
  const widthSec = durationSec(item.startedAt, item.completedAt);

  const leftPercent = Math.max(0, Math.min(100, (startSec / rangeSec) * 100));
  const widthPercent = Math.max(0, Math.min(100 - leftPercent, (widthSec / rangeSec) * 100));
  const safeWidthPercent = Math.max(0.5, widthPercent);

  const minutes = Math.max(1, Math.round(widthSec / 60));
  const tooltipContent = (
    <Box sx={{ minWidth: 200 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        {item.orderItemCode ?? "N/A"}
      </Typography>
      <Typography variant="body2">Duration: {minutes} min</Typography>
      <Typography variant="body2">Check-in: {item.checkInNote || "—"}</Typography>
      <Typography variant="body2">Check-out: {item.checkOutNote || "—"}</Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} placement="top" arrow>
      <Box
        role={onClick ? "button" : undefined}
        onClick={() => onClick?.(item)}
        sx={{
          position: "absolute",
          left: `${leftPercent}%`,
          width: `${safeWidthPercent}%`,
          top: 6,
          height: 22,
          borderRadius: 6,
          backgroundColor: item.color || "rgba(25, 118, 210, 0.7)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          cursor: onClick ? "pointer" : "default",
          transition: "opacity 0.2s ease",
          "&:hover": {
            opacity: 0.9,
          },
        }}
      />
    </Tooltip>
  );
}
