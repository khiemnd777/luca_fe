import React from "react";
import { SectionCard } from "@shared/components/ui/section-card";
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { registerSlot } from "@core/module/registry";
import { IfPermission } from "@core/auth/if-permission";
import { useParams } from "react-router-dom";
import { AutoForm } from "@core/form/auto-form";
import type { AutoFormRef } from "@root/core/form/form.types";
import { SafeButton } from "@shared/components/button/safe-button";
import { getByOrderIdAndOrderItemId } from "../api/order.api";
import { Section } from "@root/shared/components/ui/section";
import { CircularProgress } from "@mui/material";
import type { OrderModel } from "../model/order.model";

function OrderDetailHistoricalGeneralWidget() {
  const { orderId, orderItemId } = useParams();
  const frmOrderEditRef = React.useRef<AutoFormRef>(null);

  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<OrderModel | null>(null);

  // page information
  const isOriginal = detail?.latestOrderItem?.code === detail?.code;
  const originalCodeLabel = !isOriginal ? ` ⬅ Mã gốc: ${detail?.code}` : '';
  const codeLabel = `Mã: ${detail?.latestOrderItem?.code}${originalCodeLabel}`
  // title
  const title = `${codeLabel}`;

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!orderId) return;

      setLoading(true);

      try {
        const data = await getByOrderIdAndOrderItemId(Number(orderId ?? 0), Number(orderItemId ?? 0));
        if (!cancelled) {
          setDetail(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <>
      <SectionCard title={title ?? ""}
        extra={
          <>
            <IfPermission permissions={["order.create"]}>
              <SafeButton
                variant="outlined"
                startIcon={<SaveOutlinedIcon />}
                onClick={() => frmOrderEditRef.current?.submit()}
              >
                Lưu
              </SafeButton>
            </IfPermission>
          </>
        }
      >
        {loading ? (
          <Section alignItems="center" py={2}>
            <CircularProgress size={22} />
          </Section>
        ) : (
          <AutoForm
            name="order-historical-header"
            ref={frmOrderEditRef}
            initial={detail}
          />
        )}
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "order-detail-historical-header",
  name: "order-detail-historical:left",
  render: () => <OrderDetailHistoricalGeneralWidget />,
  priority: 99,
});
