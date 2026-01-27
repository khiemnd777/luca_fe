import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useCasesCompletedThisWeek } from "@features/dashboard/api/dashboard.api";
import { registerSlot } from "@root/core/module/registry";

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

registerSlot({
  id: "dashboard-stat-cases-completed",
  name: "dashboard:stat",
  render: () => <CasesCompletedStatWidget />,
});
