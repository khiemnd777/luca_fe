import { BasePage } from "@core/pages/base-page";
import { Button } from "@mui/material";
import { PageContainer } from "@shared/components/ui/page-container";
import { PageToolbar } from "@shared/components/ui/page-toolbar";
import { SectionCard } from "@shared/components/ui/section-card";
import React from "react";
import SettingsForm from "@features/settings/components/common-settings-form";
import { AutoGrid } from "@shared/components/ui/auto-grid";
import type { AutoFormRef } from "@core/form/form.types";
import { AutoForm } from "@root/core/form/auto-form";
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

export default function SettingsPage() {
  const formRef = React.useRef<AutoFormRef>(null);

  return (
    <>
      <BasePage>
        <PageContainer>
          <PageToolbar
            title="Thiết lập"
            subtitle="Cấu hình thông tin trang quản lý và giao diện"
          />
          <AutoGrid>
            <SectionCard title="Thông tin trang" extra={<Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => formRef.current?.submit()}>Lưu</Button>}>
              <AutoForm name="department-settings" ref={formRef} />
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
