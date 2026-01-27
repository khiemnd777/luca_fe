import { Chip, Divider, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "@shared/components/ui/section-card";
import { priorityColor, priorityLabel } from "@root/shared/utils/order.utils";
import { formatTime12 } from "@root/shared/utils/datetime.utils";

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
  const navigate = useNavigate();

  return (
    <SectionCard title={title}>
      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {items.map((item) => {
          const priority = (item.priority ?? "normal").toLowerCase();
          const priorityLabelText = priorityLabel(priority);
          const priorityColorValue = priorityColor(priority);
          const deliveryLabel = item.deliveryAt != null && item.deliveryAt !== ""
            ? formatTime12(item.deliveryAt)
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
              <Typography variant="caption" color="text.secondary">
                Giao lúc {deliveryLabel}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </SectionCard>
  );
}
