import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useActiveCasesToday } from "@features/dashboard/api/dashboard.api";
import { registerSlot } from "@root/core/module/registry";
import { useWebSocket } from "@root/core/network/websocket/use-web-socket";
import { useEffect } from "react";
import { invalidate } from "@root/core/hooks/use-async";
import { registerWS } from "@root/core/network/websocket/ws-widgets";

export function ActiveCasesStatWidget() {
  const { data } = useActiveCasesToday();

  return (
    <StatCard
      title="Ca Đang Làm"
      value={data?.value ?? "––"}
      delta={data?.delta}
      tone="success"
      icon={<PendingActionsIcon fontSize="small" />}
    />
  );
}

registerSlot({
  id: "dashboard-stat-active-cases",
  name: "dashboard:stat",
  render: () => <ActiveCasesStatWidget />,
});

// WS
function ActiveCasesWSWidget() {
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === "dashboard:daily:active:stats") {
      invalidate("dashboard:active-cases-today");
    }
  }, [lastMessage]);

  return null;
}

registerWS(<ActiveCasesWSWidget />);