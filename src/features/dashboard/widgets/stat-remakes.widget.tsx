import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useAvgRemakeRate } from "@features/dashboard/api/dashboard.api";
import { registerSlot } from "@root/core/module/registry";

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
