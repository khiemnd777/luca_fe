import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@root/shared/components/ui/page-container";
import { PageToolbar } from "@root/shared/components/ui/page-toolbar";
import UnderConstruction from "@core/pages/under-construction";
import { useRouteMeta } from "../module/route-meta";

export default function UnderConstructionPage() {
  const { title, subtitle } = useRouteMeta();
  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar title={title} subtitle={subtitle ?? ""} />
          <UnderConstruction />
        </PageContainer>
      </BasePage>
    </>
  );
}
