import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@shared/components/ui/page-container";
import { AutoGrid } from "@shared/components/ui/auto-grid";
import { Section } from "@shared/components/ui/section";
import { SlotHost } from "@core/module/slot-host"; // giả định sẵn có
import { useRouteMeta } from "@core/module/route-meta";
import { ResponsiveGrid } from "@root/shared/components/ui/responsive-grid";
import { Spacer } from "@root/shared/components/ui/spacer";
import { ActionToolbar } from "@root/shared/components/ui/action-toolbar";

export default function OneColumnPage() {
  const { key } = useRouteMeta();

  return (
    <BasePage>
      <PageContainer>
        <ActionToolbar actions={
          <SlotHost name={`${key}:actions`} />
        } />
        <Section>
          <SlotHost name={`${key}:header`} />
        </Section>
        <Spacer />
        <ResponsiveGrid>
          <SlotHost name={`${key}:top`} />
        </ResponsiveGrid>
        <Spacer />
        <AutoGrid>
          <Section>
            <SlotHost name={`${key}:left`} />
          </Section>
        </AutoGrid>
      </PageContainer>
    </BasePage>
  );
}
