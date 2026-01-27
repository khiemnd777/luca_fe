import { useDueToday } from "@features/dashboard/api/dashboard.api";
import type { DueTodayItem } from "@features/dashboard/model/dashboard.model";
import { registerSlot } from "@root/core/module/registry";
import { DueTodayCard } from "../components/due-today-card";
import { formatTime12 } from "@root/shared/utils/datetime.utils";

const mockDueToday: DueTodayItem[] = [
  {
    id: 1,
    code: "CA-24031",
    dentist: "Dr. Nguyen",
    patient: "Tram Le",
    deliveryAt: formatTime12("2026-01-27T14:30:00.000Z"),
    priority: "normal",
  },
  {
    id: 2,
    code: "CA-24044",
    dentist: "Dr. Pham",
    patient: "Minh Tran",
    deliveryAt: formatTime12("2026-01-27T15:05:00.000Z"),
    priority: "high",
  },
  {
    id: 3,
    code: "CA-24058",
    dentist: "Dr. Do",
    patient: "Linh Vo",
    deliveryAt: formatTime12("2026-01-27T10:25:00.000Z"),
    priority: "urgent",
  },
  {
    id: 4,
    code: "CA-24063",
    dentist: "Dr. Bui",
    patient: "An Hoang",
    deliveryAt: formatTime12("2026-01-27T08:45:00.000Z"),
    priority: "critical",
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
});
