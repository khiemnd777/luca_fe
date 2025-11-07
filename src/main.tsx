import React from "react";
import ReactDOM from "react-dom/client";
import App from "@root/app/app";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "@root/app/theme";
import "@root/mapper/index";

// Auto-load modules
import.meta.glob("@features/**/index.tsx", { eager: true });
// Auto-load form schemas
import.meta.glob("@features/**/schemas/*.schema.ts", { eager: true });
// Auto-load tables
import.meta.glob("@features/**/tables/*.table.ts", { eager: true });
// Auto-load widgets
import.meta.glob("@features/**/presentation/widgets/*.widget.tsx", { eager: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
