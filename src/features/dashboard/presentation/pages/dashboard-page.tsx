import { Stack, Typography } from "@mui/material";
import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@shared/components/ui/page-container";
import { ResponsiveGrid } from "@shared/components/ui/responsive-grid";
import { Spacer } from "@shared/components/ui/spacer";
import { SlotHost } from "@core/module/slot-host";

const productionQueue = [
  { id: "DL-2841", patient: "M. Carter", caseType: "Zirconia Crown", stage: "Milling", due: "Today 3:00 PM", technician: "Alex" },
  { id: "DL-2834", patient: "L. Nguyen", caseType: "Implant Abutment", stage: "Design", due: "Tomorrow 9:00 AM", technician: "Priya" },
  { id: "DL-2831", patient: "S. Patel", caseType: "Emax Veneers", stage: "Stain & Glaze", due: "Tomorrow 1:30 PM", technician: "Marco" },
  { id: "DL-2827", patient: "R. Kim", caseType: "Night Guard", stage: "Print", due: "Jan 28, 2026", technician: "Jules" },
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
          <SlotHost name="dashboard:stat" />
        </ResponsiveGrid>

        <Spacer />

        <ResponsiveGrid xs={1} sm={2} md={2} lg={2} xl={2}>
          <SlotHost name="dashboard:line2" direction="column" />
        </ResponsiveGrid>

        <ResponsiveGrid xs={1} sm={2} md={2} lg={4} xl={4}>
          <SlotHost name="dashboard:line3" direction="column" />
        </ResponsiveGrid>

        {/* <AutoGrid scheme="lead" equalAt="lg">
          <ProductionQueueCard items={productionQueue} />
          <CaseStatusCard items={caseStatuses} />
        </AutoGrid> */}
      </PageContainer>
    </BasePage>
  );
}
