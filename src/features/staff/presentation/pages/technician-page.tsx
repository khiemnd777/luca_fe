import { BasePage } from "@core/pages/base-page";
import UnderConstruction from "@root/pages/common/under-construction";
import { PageContainer } from "@root/shared/components/ui/page-container";
import { PageToolbar } from "@root/shared/components/ui/page-toolbar";

export default function TechnicianPage() {
  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar title="Kỹ thuật viên" />
          <UnderConstruction />
        </PageContainer>
      </BasePage>
    </>
  );
}
