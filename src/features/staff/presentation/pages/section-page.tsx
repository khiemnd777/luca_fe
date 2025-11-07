import { BasePage } from "@core/pages/base-page";
import { Button } from "@mui/material";
import { Section } from "@root/shared/components/ui/section";
import { SectionCard } from "@root/shared/components/ui/section-card";
import { AutoGrid } from "@shared/components/ui/auto-grid";
import { PageContainer } from "@shared/components/ui/page-container";
import { PageToolbar } from "@shared/components/ui/page-toolbar";
import AddIcon from '@mui/icons-material/Add';
import { openFormDialog } from "@core/form/form-dialog.service";
import { AutoTable } from "@core/table/auto-table";

export default function SectionPage() {
  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar title="Bộ phận" subtitle="Các bộ phận thao tác gia công các chi tiết nha khoa" />
          <AutoGrid>
            <Section>
              <SectionCard extra={
                <>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
                    openFormDialog("section");
                  }} >Thêm bộ phận</Button>
                </>
              }>
                <AutoTable name="sections" />
              </SectionCard>
            </Section>
            <Section />
          </AutoGrid>
        </PageContainer>
      </BasePage>
    </>
  );
}
