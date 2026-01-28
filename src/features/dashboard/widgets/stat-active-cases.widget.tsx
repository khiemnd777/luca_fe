import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useActiveCasesToday } from "@features/dashboard/api/dashboard.api";
import { registerSlot } from "@root/core/module/registry";

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
