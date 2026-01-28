import { useActiveToday } from "@features/dashboard/api/dashboard.api";
import type { ActiveTodayItem } from "@features/dashboard/model/dashboard.model";
import { registerSlot } from "@root/core/module/registry";
import { ActiveTodayCard } from "../components/active-today-card";

export const mockActiveToday: ActiveTodayItem[] = [
  {
    id: 0,
    code: "",
    dentist: "",
    patient: "",
    deliveryAt: "",
    createdAt: "",
    ageDays: -1,
    priority: "high",
  },
];


function ActiveTodayWidget() {
  const { data: activeTodayData } = useActiveToday();
  const activeToday = activeTodayData && activeTodayData.length > 0 ? activeTodayData : mockActiveToday;
  return (
    <ActiveTodayCard items={activeToday} />
  );
}

registerSlot({
  id: "dashboard-active-today",
  name: "dashboard:line2",
  render: () => <ActiveTodayWidget />,
  priority: 1,
});
