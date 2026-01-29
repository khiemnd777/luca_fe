import SpeedIcon from "@mui/icons-material/Speed";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useAvgTurnaround } from "@features/dashboard/api/dashboard.api";
import { registerSlot } from "@root/core/module/registry";
import { useWebSocket } from "@root/core/network/websocket/use-web-socket";
import { useEffect } from "react";
import { invalidate } from "@root/core/hooks/use-async";
import { registerWS } from "@root/core/network/websocket/ws-widgets";

export function AvgTurnaroundStatWidget() {
  const { data } = useAvgTurnaround();

  return (
    <StatCard
      title="TB. Xong Một Ca"
      value={data?.value ?? "––"}
      delta={data?.delta}
      caption={data?.caption}
      tone="success"
      icon={<SpeedIcon fontSize="small" />}
    />
  );
}

registerSlot({
  id: "dashboard-stat-avg-turnaround",
  name: "dashboard:stat",
  render: () => <AvgTurnaroundStatWidget />,
});

// WS
function AvgTurnaroundWSWidget() {
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === "dashboard:daily:turnaround:stats") {
      invalidate("dashboard:avg-turnaround");
    }
  }, [lastMessage]);

  return null;
}

registerWS(<AvgTurnaroundWSWidget />);