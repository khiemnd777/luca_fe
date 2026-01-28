import { Chip, Divider, Stack, Typography } from "@mui/material";
import { SectionCard } from "@shared/components/ui/section-card";
import { formatAgeDays, formatDateTime12 } from "@root/shared/utils/datetime.utils";
import { navigate } from "@root/core/navigation/navigate";

export type ActiveTodayItem = {
  id: number;
  code: string;
  dentist: string;
  patient: string;
  deliveryAt: string;
  createdAt: string;
  ageDays: number;
  priority?: string;
};

type ActiveTodayCardProps = {
  title?: string;
  items: ActiveTodayItem[];
};

export function ActiveTodayCard({ title = "Đang làm", items }: ActiveTodayCardProps) {
  return (
    <SectionCard title={title}>
      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {items.map((item) => {
          const createdAtLabel = item.createdAt != null && item.createdAt !== ""
            ? formatDateTime12(item.createdAt)
            : "––";

          return (
            <Stack
              key={item.id}
              spacing={0.5}
              onClick={() => navigate(`/order/${item.id}`)}
              role="button"
              sx={{ cursor: "pointer" }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={700}>
                  {item.code}
                </Typography>
                <Chip size="small" variant="outlined" label={formatAgeDays(item.ageDays)} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {item.dentist} {item.patient ? "•" : ""} {item.patient}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tạo lúc {createdAtLabel}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </SectionCard>
  );
}
