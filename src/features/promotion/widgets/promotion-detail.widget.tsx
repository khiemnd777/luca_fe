import React from "react";
import { SectionCard } from "@root/shared/components/ui/section-card";
import { registerSlot } from "@root/core/module/registry";
import { IfPermission } from "@root/core/auth/if-permission";
import type { AutoFormRef } from "@root/core/form/form.types";
import { useParams } from "react-router-dom";
import { SafeButton } from "@shared/components/button/safe-button";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { AutoForm } from "@root/core/form/auto-form";

function PromotionDetailWidget() {
  const frmPromotionRef = React.useRef<AutoFormRef>(null);
  const { id } = useParams();
  const promotionId = Number(id ?? 0);

  return (
    <>
      <SectionCard title="Chi tiết khuyến mãi" extra={
        <IfPermission permissions={["promotion.update"]}>
          <SafeButton variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => frmPromotionRef.current?.submit()}>
            Luu
          </SafeButton>
        </IfPermission>
      }>
        <AutoForm name="promotion" ref={frmPromotionRef} initial={{ id: promotionId }} />
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "promotion-detail",
  name: "promotion-detail:left",
  render: () => <PromotionDetailWidget />,
});
