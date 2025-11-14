import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@shared/components/ui/page-container";
import { PageToolbar } from "@shared/components/ui/page-toolbar";
import { AutoGrid } from "@shared/components/ui/auto-grid";
import { Section } from "@shared/components/ui/section";
import { SlotHost } from "@core/module/slot-host"; // giả định sẵn có
import { useRouteMeta } from "@core/module/route-meta";

export default function OneColumnPage() {
  const { key, title, subtitle } = useRouteMeta();

  return (
    <BasePage>
      <PageContainer>
        <PageToolbar title={title ?? ""} subtitle={subtitle ?? ""} actions={
          <SlotHost name={`${key}:actions`} />
        } />
        <AutoGrid>
          <Section>
            <SlotHost name={`${key}:left`} />
          </Section>
        </AutoGrid>
      </PageContainer>
    </BasePage>
  );
}
