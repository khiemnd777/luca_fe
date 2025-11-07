import { BasePage } from "@core/pages/base-page";
import { PageContainer } from "@shared/components/ui/page-container";
import { PageToolbar } from "@shared/components/ui/page-toolbar";
import { SectionCard } from "@shared/components/ui/section-card";
import { Spacer } from "@shared/components/ui/spacer";
import { AutoTable } from "@root/core/table/auto-table";

export default function ExamplePage() {
  return (
    <BasePage>
      <PageContainer>
        <PageToolbar
          title="Sample Product Table"
          subtitle="Demonstration of EditTable with server-side paging and sorting"
          actions={
            <>
            </>
          }
        />

        <SectionCard>
          <AutoTable name="sample" />
        </SectionCard>

        <Spacer />

        <SectionCard sx={{ color: "text.secondary", fontSize: 12 }}>
          Tips:
          <ul style={{ marginTop: 4 }}>
            <li>Muốn freeze nhiều cột trái/phải: đặt <code>stickyLeft</code>/<code>stickyRight</code> và **khai báo width cố định** cho từng cột.</li>
            <li>Có AppBar cố định? Dùng <code>stickyTopOffset</code> để đẩy header xuống đúng vị trí.</li>
            <li>Muốn custom cell phức tạp: dùng <code>render</code> hoặc <code>type="custom"</code> + <code>render</code>.</li>
            <li>Muốn sort client-side: bỏ <code>onSortChange</code>/<code>sortBy</code>/<code>sortDirection</code>, component sẽ tự sort local.</li>
          </ul>
        </SectionCard>
      </PageContainer>
    </BasePage>
  );
}
