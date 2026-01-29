import { useDueToday } from "@features/dashboard/api/dashboard.api";
import type { DueTodayItem } from "@features/dashboard/model/dashboard.model";
import { registerSlot } from "@root/core/module/registry";
import { DueTodayCard } from "../components/due-today-card";

const mockDueToday: DueTodayItem[] = [
  {
    id: 0,
    code: "–",
    dentist: "",
    patient: "",
    deliveryAt: "",
    ageDays: 0,
    priority: "–",
  },
];

function DueTodayWidget() {
  const { data: dueTodayData } = useDueToday();
  const dueToday = dueTodayData && dueTodayData.length > 0 ? dueTodayData : mockDueToday;
  return (
    <DueTodayCard items={dueToday} />
  );
}

registerSlot({
  id: "dashboard-due-today",
  name: "dashboard:line2",
  render: () => <DueTodayWidget />,
  priority: 1,
});
