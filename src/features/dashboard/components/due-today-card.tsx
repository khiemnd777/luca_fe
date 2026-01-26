import { Chip, Divider, Stack, Typography } from "@mui/material";
import { SectionCard } from "@shared/components/ui/section-card";

export type DueTodayItem = {
  id: string;
  patient: string;
  caseType: string;
  time: string;
  priority?: "standard" | "rush";
};

type DueTodayCardProps = {
  title?: string;
  items: DueTodayItem[];
};

export function DueTodayCard({ title = "Due Today", items }: DueTodayCardProps) {
  return (
    <SectionCard title={title}>
      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {items.map((item) => (
          <Stack key={item.id} spacing={0.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight={700}>{item.caseType}</Typography>
              <Chip
                size="small"
                color={item.priority === "rush" ? "warning" : "default"}
                label={item.priority === "rush" ? "Rush" : "Standard"}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {item.patient} • {item.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">Pickup {item.time}</Typography>
          </Stack>
        ))}
      </Stack>
    </SectionCard>
  );
}
