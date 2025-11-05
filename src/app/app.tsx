import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AppRouter } from "@root/app/routes";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppRouter />
      <Toaster position="top-right" />
    </LocalizationProvider>
  );
}
