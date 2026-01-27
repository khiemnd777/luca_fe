import SpeedIcon from "@mui/icons-material/Speed";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useAvgTurnaround } from "@features/dashboard/api/dashboard.api";
import { registerSlot } from "@root/core/module/registry";

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
