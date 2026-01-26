import { LinearProgress, Stack, Typography, type LinearProgressProps } from "@mui/material";
import { SectionCard } from "@shared/components/ui/section-card";

export type CaseStatusItem = {
  label: string;
  count: number;
  target?: number;
  color?: LinearProgressProps["color"];
  helper?: string;
};

type CaseStatusCardProps = {
  title?: string;
  items: CaseStatusItem[];
};

export function CaseStatusCard({ title = "Case Status", items }: CaseStatusCardProps) {
  return (
    <SectionCard title={title}>
      <Stack spacing={1.5}>
        {items.map((item) => {
          const progress = item.target ? Math.min(100, Math.round((item.count / item.target) * 100)) : undefined;
          return (
            <Stack key={item.label} spacing={0.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                <Typography variant="body2" color="text.secondary">{item.count}</Typography>
              </Stack>
              {typeof progress === "number" ? (
                <LinearProgress variant="determinate" value={progress} color={item.color ?? "primary"} />
              ) : null}
              {item.helper ? (
                <Typography variant="caption" color="text.secondary">{item.helper}</Typography>
              ) : null}
            </Stack>
          );
        })}
      </Stack>
    </SectionCard>
  );
}
