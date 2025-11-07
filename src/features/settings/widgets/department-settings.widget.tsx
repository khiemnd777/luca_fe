import { SectionCard } from "@shared/components/ui/section-card";
import React from "react";
import type { AutoFormRef } from "@core/form/form.types";
import { AutoForm } from "@root/core/form/auto-form";
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { SafeButton } from "@shared/components/button/safe-button";
import { registerSlot } from "@root/core/module/registry";

function DepartmentSettingsWidget() {
  const formRef = React.useRef<AutoFormRef>(null);

  return (
    <>
      <SectionCard title="Thông tin trang" extra={
        <SafeButton variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => formRef.current?.submit()}>Lưu</SafeButton>
      }>
        <AutoForm name="department-settings" ref={formRef} />
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "department-settings",
  name: "settings:left",
  render: () => <DepartmentSettingsWidget />,
});