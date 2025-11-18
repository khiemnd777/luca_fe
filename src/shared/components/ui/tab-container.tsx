import * as React from "react";
import { Box, Tabs, Tab } from "@mui/material";

export type TabItem = {
  label: string;
  value: string;
  content: React.ReactNode;
};

type TabContainerProps = {
  tabs: TabItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  tabSx?: any;
  contentSx?: any;
};

export function TabContainer({
  tabs,
  defaultValue,
  onChange,
  tabSx,
  contentSx,
}: TabContainerProps) {
  const [value, setValue] = React.useState<string>(
    defaultValue ?? tabs[0]?.value ?? ""
  );

  const handleChange = (_: any, newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  const active = tabs.find((t) => t.value === value);

  return (
    <Box sx={{ width: "100%" }}>
      <Tabs
        value={value}
        onChange={handleChange}
        sx={{ borderBottom: 1, borderColor: "divider", ...tabSx }}
      >
        {tabs.map((t) => (
          <Tab key={t.value} label={t.label} value={t.value} />
        ))}
      </Tabs>

      <Box sx={{ mt: 2, ...contentSx }}>
        {active?.content}
      </Box>
    </Box>
  );
}
