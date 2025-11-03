import * as React from "react";
import { Stack, Box } from "@mui/material";
import { listSlots } from "@core/module/registry";
import type { SlotName } from "@core/module/types";

/*
// topbar phải: hàng ngang, giữa, cách 2 (theme spacing)
<SlotHost name="app:topbar:right" direction="row" gap={2} align="center" />

// sidebar: cột, gap 12px cố định
<SlotHost name="me:sidebar" direction="column" gap="12px" />

// widget area: wrap khi chật
<SlotHost name="dashboard:widgets" direction="row" wrap gap={2} justify="space-between" />
*/

type SlotHostProps = {
  name: SlotName;
  direction?: "row" | "column";
  gap?: number | string; // 1 | 2 | 3 ... (theme spacing) hoặc "12px" | "1rem"
  wrap?: boolean;
  align?: React.CSSProperties["alignItems"];         // center | flex-start | flex-end | baseline | stretch
  justify?: React.CSSProperties["justifyContent"];   // space-between | center | ...
  className?: string;
  style?: React.CSSProperties;
  itemClassName?: string;
};

export function SlotHost({
  name,
  direction = "row",
  gap = 8,
  wrap = false,
  align = "stretch",
  justify = "flex-start",
  className,
  style,
  itemClassName,
}: SlotHostProps) {
  const slots = React.useMemo(() => listSlots(name), [name]);

  // MUI Stack: spacing nhận number | string (number => theme spacing)
  const spacingProp = typeof gap === "number" ? gap : undefined;
  const sxGap = typeof gap === "string" ? { gap } : undefined;

  return (
    <Stack
      direction={direction}
      spacing={spacingProp}
      alignItems={align}
      justifyContent={justify}
      flexWrap={wrap ? "wrap" : "nowrap"}
      className={className}
      style={style}
      sx={sxGap}
    >
      {slots.map((s) => (
        <Box key={s.id} className={itemClassName}>
          {s.render()}
        </Box>
      ))}
    </Stack>
  );
}
