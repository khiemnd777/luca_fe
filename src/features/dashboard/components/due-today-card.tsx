import { Chip, Divider, Stack, Typography } from "@mui/material";
import { SectionCard } from "@shared/components/ui/section-card";
import { priorityColor, priorityLabel } from "@root/shared/utils/order.utils";
import { formatDateTime12, formatTime12, isToday } from "@root/shared/utils/datetime.utils";
import { navigate } from "@root/core/navigation/navigate";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export type DueTodayItem = {
  id: number;
  code: string;
  dentist: string;
  patient: string;
  deliveryAt: string;
  priority?: string;
};

type DueTodayCardProps = {
  title?: string;
  items: DueTodayItem[];
};

export function DueTodayCard({ title = "Giao hôm nay", items }: DueTodayCardProps) {
  return (
    <SectionCard title={title}>
      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {items.map((item) => {
          const priority = (item.priority ?? "normal").toLowerCase();
          const priorityLabelText = priorityLabel(priority);
          const priorityColorValue = priorityColor(priority);
          const deliveryDate = item.deliveryAt != null && item.deliveryAt !== ""
            ? new Date(item.deliveryAt)
            : null;
          const deliveryDateMs = deliveryDate != null ? deliveryDate.getTime() : null;
          const isValidDeliveryDate = deliveryDateMs != null && !Number.isNaN(deliveryDateMs);
          const now = new Date();
          const isTodayValue = isValidDeliveryDate && deliveryDate ? isToday(deliveryDate, now) : false;
          const isOverdue = Boolean(isValidDeliveryDate && deliveryDateMs < now.getTime());
          const deliveryLabel = isValidDeliveryDate && deliveryDate
            ? (isTodayValue ? formatTime12(deliveryDate) : formatDateTime12(deliveryDate))
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
                <Chip
                  size="small"
                  label={priorityLabelText}
                  sx={{
                    bgcolor: priorityColorValue,
                    color: "#fff",
                  }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {item.dentist} {item.patient ? "•" : ""} {item.patient}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
              >
                Giao lúc {deliveryLabel}
                {isOverdue ? (
                  <WarningAmberIcon fontSize="inherit" sx={{ color: "error.main" }} />
                ) : null}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </SectionCard>
  );
}
