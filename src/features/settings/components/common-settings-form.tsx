import * as React from "react";
import { FormControlLabel, Switch } from "@mui/material";

type Props = {
  darkMode: boolean;
  onChange?: (next: boolean) => void;
  persistLocal?: boolean;
};

export default function SettingsForm({ darkMode, onChange, persistLocal = true }: Props) {
  const handleToggle = (_: React.ChangeEvent<HTMLInputElement>, v: boolean) => {
    // Apply ngay trên client
    if (persistLocal) {
      localStorage.setItem("pref_theme", v ? "dark" : "light");
    }
    onChange?.(v);

    // Nếu có global theme store:
    // setMode(v ? "dark" : "light");
    // Hoặc dùng context/theming system của bạn để apply ngay.
  };

  return (
    <>
      <FormControlLabel
        control={<Switch checked={darkMode} onChange={handleToggle} inputProps={{ "aria-label": "Dark mode" }} />}
        label={darkMode ? "Dark mode" : "Light mode"}
      />
    </>
  );
}
