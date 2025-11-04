import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@root/shared/components/ui/page-container";
import { PageToolbar } from "@root/shared/components/ui/page-toolbar";
import UnderConstruction from "@root/pages/common/under-construction";

export default function RBACPage() {
  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar title="Quyền hạn" />
          <UnderConstruction />
        </PageContainer>
      </BasePage>
    </>
  );
}
