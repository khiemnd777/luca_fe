import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useCasesCompletedThisWeek } from "@features/dashboard/api/dashboard.api";

export function CasesCompletedStatWidget() {
  const { data } = useCasesCompletedThisWeek();

  return (
    <StatCard
      title="Ca Hoàn Thành"
      value={data?.value ?? "––"}
      delta={data?.delta}
      tone="info"
      icon={<AssignmentTurnedInIcon fontSize="small" />}
    />
  );
}
