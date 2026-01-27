import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { StatCard } from "@features/dashboard/components/stat-card";
import { useAvgRemakeRate } from "@features/dashboard/api/dashboard.api";

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
