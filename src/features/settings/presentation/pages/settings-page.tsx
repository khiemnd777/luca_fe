import { BasePage } from "@core/pages/base-page";
import { Button } from "@mui/material";
import { PageContainer } from "@shared/components/ui/page-container";
import { PageToolbar } from "@shared/components/ui/page-toolbar";
import { SectionCard } from "@shared/components/ui/section-card";
import DepartmentForm, { type DepartmentFormRef } from "@features/settings/components/department-form";
import React from "react";
import type { MyDepartmentDto } from "@core/network/my-department.dto";
import { useAuth } from "@core/auth/use-auth";
import SettingsForm from "@features/settings/components/common-settings-form";
import { AutoGrid } from "@root/shared/components/ui/auto-grid";

export default function SettingsPage() {
  const { department, fetchDepartment } = useAuth();
  const formRef = React.useRef<DepartmentFormRef>(null);
  const [initial, setInitial] = React.useState<Partial<MyDepartmentDto | null>>();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setInitial(department);
    })();
    return () => {
      mounted = false;
    };
  }, [department]);

  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar
            title="Thiết lập"
            subtitle="Cấu hình thông tin trang quản lý và giao diện"
          />
          <AutoGrid>
            <SectionCard title="Thông tin trang" extra={<Button variant="contained" onClick={() => formRef.current?.submit()}>Lưu</Button>}>
              <DepartmentForm ref={formRef} initial={initial} onSaved={async () => {
                // Refresh department after adjusting.
                await fetchDepartment();
              }} />
            </SectionCard>
            <SectionCard title="Giao diện">
              <SettingsForm />
            </SectionCard>
          </AutoGrid>
        </PageContainer>
      </BasePage>
    </>
  );
}
