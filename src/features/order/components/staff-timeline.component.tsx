import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { OrderItemProcessInProgressProcessModel } from "@features/order/model/order-item-process-inprogress-process.model";
import { normalizeTimelineInput } from "@features/order/components/staff-timeline.utils";
import { StaffTimelineLane } from "@features/order/components/staff-timeline-lane.component";

export type StaffTimelineProps = {
  items: OrderItemProcessInProgressProcessModel[];
  rangeStart: Date;
  rangeEnd: Date;
  onBlockClick?: (item: OrderItemProcessInProgressProcessModel) => void;
};

export function StaffTimeline({ items, rangeStart, rangeEnd, onBlockClick }: StaffTimelineProps) {
  const lanes = normalizeTimelineInput(items);
  const startDay = dayjs(rangeStart).startOf("day");
  const endDay = dayjs(rangeEnd).startOf("day");
  const dayCount = Math.max(1, endDay.diff(startDay, "day") + 1);
  const isSingleDay = dayCount === 1;

  const axisLabels = React.useMemo(() => {
    if (isSingleDay) {
      return ["0", "4", "8", "12", "16", "20", "24"];
    }

    const labels: string[] = [];
    for (let i = 0; i < dayCount; i += 1) {
      labels.push(startDay.add(i, "day").format("MM/DD"));
    }
    return labels;
  }, [dayCount, isSingleDay, startDay]);

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ minWidth: 140 }} />
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between">
            {axisLabels.map((label) => (
              <Typography key={label} variant="caption" color="text.secondary">
                {label}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Stack>

      {lanes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No work recorded in this range.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {lanes.map((lane) => (
            <StaffTimelineLane
              key={lane.processName}
              laneName={lane.processName}
              items={lane.items}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              gridCount={isSingleDay ? 24 : dayCount}
              gridType={isSingleDay ? "hour" : "day"}
              onBlockClick={onBlockClick}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
