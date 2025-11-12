import React from "react";
import { SectionCard } from "@root/shared/components/ui/section-card";
import type { AutoFormRef } from "@root/core/form/form.types";
import { AutoForm } from "@root/core/form/auto-form";
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { SafeButton } from "@shared/components/button/safe-button";
import { registerSlot } from "@root/core/module/registry";
import { useParams } from "react-router-dom";

function StaffDetailWidget() {
  const {staffId} = useParams();
  const formStaffInformationRef = React.useRef<AutoFormRef>(null);
  return (
    <SectionCard title={"Thông tin nhân sự"} extra={
      <SafeButton variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => formStaffInformationRef.current?.submit()}>
        Lưu
      </SafeButton>
    }>
      <AutoForm name="staff" ref={formStaffInformationRef} initial={{id: staffId}} />
    </SectionCard>
  );
}

registerSlot({
  id: "staff-information",
  name: "staff-detail:left",
  priority: 2,
  render: () => <StaffDetailWidget />,
});
