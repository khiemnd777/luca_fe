import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@root/shared/components/ui/page-container";
import { PageToolbar } from "@root/shared/components/ui/page-toolbar";
import UnderConstruction from "@root/pages/common/under-construction";

export default function DentistPage() {
  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar title="Nha sĩ" />
          <UnderConstruction />
        </PageContainer>
      </BasePage>
    </>
  );
}
