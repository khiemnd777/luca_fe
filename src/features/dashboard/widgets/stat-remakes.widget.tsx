import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useAvgRemakeRate } from "@features/dashboard/api/dashboard.api";
import { registerSlot } from "@root/core/module/registry";
import { useWebSocket } from "@root/core/network/websocket/use-web-socket";
import { useEffect } from "react";
import { invalidate } from "@root/core/hooks/use-async";
import { registerWS } from "@root/core/network/websocket/ws-widgets";

export function RemakesStatWidget() {
  const { data } = useAvgRemakeRate();

  return (
    <StatCard
      title="Tỷ Lệ Làm Lại"
      value={data?.value ?? "––"}
      delta={data?.delta}
      caption={data?.caption}
      tone="warning"
      icon={<WarningAmberIcon fontSize="small" />}
    />
  );
}

registerSlot({
  id: "dashboard-stat-remakes",
  name: "dashboard:stat",
  render: () => <RemakesStatWidget />,
});

// WS
function RemakeCasesWSWidget() {
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === "dashboard:daily:remake:stats") {
      invalidate("dashboard:avg-remake-rate");
    }
  }, [lastMessage]);

  return null;
}

registerWS(<RemakeCasesWSWidget />);