import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@root/shared/components/ui/page-container";
import { PageToolbar } from "@root/shared/components/ui/page-toolbar";
import { AutoGrid } from "@root/shared/components/ui/auto-grid";
import { Section } from "@root/shared/components/ui/section";
import { SectionCard } from "@root/shared/components/ui/section-card";
import { AutoTable } from "@root/core/table/auto-table";
import { Button } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { openFormDialog } from "@root/core/form/form-dialog.service";

export default function RolePage() {
  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar title="Vai trò" subtitle="Quản lý vai trò của nhân viên" />
          <AutoGrid>
            <Section>
              <SectionCard extra={
                <>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
                    openFormDialog("role");
                  }} >Thêm vai trò</Button>
                </>
              }>
                <AutoTable name="roles" />
              </SectionCard>
            </Section>
            <Section />
          </AutoGrid>
        </PageContainer>
      </BasePage>
    </>
  );
}
