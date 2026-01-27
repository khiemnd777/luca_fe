import { useCaseStatuses } from "@features/dashboard/api/dashboard.api";
import { registerSlot } from "@root/core/module/registry";
import { CaseStatusCard } from "../components/case-status-card";

function CaseStatusesWidget() {
  const { data } = useCaseStatuses();
  const items = data ?? [];
  return <CaseStatusCard items={items} />;
}

registerSlot({
  id: "dashboard-case-statuses",
  name: "dashboard:line2",
  render: () => <CaseStatusesWidget />,
  priority: 2,
});
