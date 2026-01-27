import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useActiveCasesToday } from "@features/dashboard/api/dashboard.api";

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
