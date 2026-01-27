import { registerSlot } from "@root/core/module/registry";
import { CaseStatusCard } from "../components/case-status-card";

const caseStatuses = [
  { label: "Received", count: 12, target: 24, color: "info", helper: "Awaiting design" },
  { label: "Design", count: 9, target: 18, color: "primary", helper: "CAD in progress" },
  { label: "Milling/Print", count: 15, target: 20, color: "secondary", helper: "Crown/bridge queue" },
  { label: "Stain & Glaze", count: 8, target: 16, color: "warning", helper: "Esthetics ready" },
  { label: "QC & Pack", count: 4, target: 12, color: "success", helper: "Shipping today" },
];

function CaseStatusesWidget() {
  return (<CaseStatusCard items={caseStatuses} />);
}

registerSlot({
  id: "dashboard-case-statuses",
  name: "dashboard:line2",
  render: () => <CaseStatusesWidget />,
});
