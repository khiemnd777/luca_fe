import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AppRouter } from "@root/app/routes";

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppRouter />
    </LocalizationProvider>
  );
}
