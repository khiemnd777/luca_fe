import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@root/shared/components/ui/page-container";
import { PageToolbar } from "@root/shared/components/ui/page-toolbar";
import UnderConstruction from "@core/pages/under-construction";
import { useRouteMeta } from "../module/route-meta";

export default function UnderConstructionPage() {
  const { title } = useRouteMeta();
  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar title={title} />
          <UnderConstruction />
        </PageContainer>
      </BasePage>
    </>
  );
}
