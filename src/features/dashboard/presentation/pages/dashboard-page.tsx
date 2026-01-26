import { Stack, Typography } from "@mui/material";
import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@shared/components/ui/page-container";
import { AutoGrid } from "@shared/components/ui/auto-grid";
import { ResponsiveGrid } from "@shared/components/ui/responsive-grid";
import { Spacer } from "@shared/components/ui/spacer";
import { StatCard } from "@features/dashboard/components/stat-card";
import { CaseStatusCard } from "@features/dashboard/components/case-status-card";
import { ProductionQueueCard } from "@features/dashboard/components/production-queue-card";
import { DueTodayCard } from "@features/dashboard/components/due-today-card";
import { InventoryAlertsCard } from "@features/dashboard/components/inventory-alerts-card";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SpeedIcon from "@mui/icons-material/Speed";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const stats = [
  { title: "Active Cases", value: 48, delta: "+6 today", tone: "success", icon: <PendingActionsIcon fontSize="small" /> },
  { title: "Cases Completed", value: 132, delta: "+18 this week", tone: "info", icon: <AssignmentTurnedInIcon fontSize="small" /> },
  { title: "Avg Turnaround", value: "2.4 days", delta: "-0.3", tone: "success", icon: <SpeedIcon fontSize="small" /> },
  { title: "Remakes", value: "3.1%", delta: "+0.4", tone: "warning", icon: <WarningAmberIcon fontSize="small" /> },
] as const;

const caseStatuses = [
  { label: "Received", count: 12, target: 24, color: "info", helper: "Awaiting design" },
  { label: "Design", count: 9, target: 18, color: "primary", helper: "CAD in progress" },
  { label: "Milling/Print", count: 15, target: 20, color: "secondary", helper: "Crown/bridge queue" },
  { label: "Stain & Glaze", count: 8, target: 16, color: "warning", helper: "Esthetics ready" },
  { label: "QC & Pack", count: 4, target: 12, color: "success", helper: "Shipping today" },
];

const productionQueue = [
  { id: "DL-2841", patient: "M. Carter", caseType: "Zirconia Crown", stage: "Milling", due: "Today 3:00 PM", technician: "Alex" },
  { id: "DL-2834", patient: "L. Nguyen", caseType: "Implant Abutment", stage: "Design", due: "Tomorrow 9:00 AM", technician: "Priya" },
  { id: "DL-2831", patient: "S. Patel", caseType: "Emax Veneers", stage: "Stain & Glaze", due: "Tomorrow 1:30 PM", technician: "Marco" },
  { id: "DL-2827", patient: "R. Kim", caseType: "Night Guard", stage: "Print", due: "Jan 28, 2026", technician: "Jules" },
];

const dueToday = [
  { id: "DL-2838", patient: "A. Smith", caseType: "Bridge (3-unit)", time: "2:00 PM", priority: "rush" },
  { id: "DL-2840", patient: "K. Tran", caseType: "Zirconia Crown", time: "4:30 PM", priority: "standard" },
  { id: "DL-2835", patient: "D. Lopez", caseType: "Implant Crown", time: "5:30 PM", priority: "standard" },
];

const inventoryAlerts = [
  { name: "Zirconia Disc A2", remaining: 5, threshold: 12, unit: "pcs", color: "warning" },
  { name: "Staining Liquid", remaining: 1.2, threshold: 4, unit: "L", color: "error" },
  { name: "Resin (Model)", remaining: 3, threshold: 10, unit: "kg", color: "warning" },
];

export default function DashboardPage() {
  return (
    <BasePage>
      <PageContainer>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          {/* <Typography variant="h5" fontWeight={700}>Dental Lab Dashboard</Typography> */}
          <Typography variant="body2" color="text.secondary">
            Live operational snapshot for January 26, 2026.
          </Typography>
        </Stack>

        <ResponsiveGrid xs={1} sm={2} md={2} lg={4} xl={4}>
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              delta={stat.delta}
              tone={stat.tone}
              icon={stat.icon}
            />
          ))}
        </ResponsiveGrid>

        <Spacer />

        <AutoGrid scheme="lead" equalAt="lg">
          <ProductionQueueCard items={productionQueue} />
          <CaseStatusCard items={caseStatuses} />
        </AutoGrid>

        <AutoGrid scheme="equal" equalAt="lg">
          <DueTodayCard items={dueToday} />
          <InventoryAlertsCard items={inventoryAlerts} />
        </AutoGrid>
      </PageContainer>
    </BasePage>
  );
}
