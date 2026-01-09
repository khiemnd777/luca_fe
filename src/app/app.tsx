import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AppRouter } from "@root/app/routes";
import { Toaster } from "react-hot-toast";
import { FormDialogHost } from "@core/form/form-dialog-host";
import { WebSocketProvider } from "@root/core/network/websocket/ws-provider";
import { WebSocketWidgets } from "@root/core/network/websocket/ws-widgets";
import { StackMessage } from "@root/core/network/websocket/ws-stack";

export default function App() {
  return (
    <WebSocketProvider>
      <WebSocketWidgets />
      <StackMessage />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AppRouter />
        <Toaster position="top-right" />
        <FormDialogHost />
      </LocalizationProvider>
    </WebSocketProvider>
  );
}
