import React from "react";
import { SectionCard } from "@shared/components/ui/section-card";
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { registerSlot } from "@core/module/registry";
import { IfPermission } from "@core/auth/if-permission";
import { useParams } from "react-router-dom";
import { AutoForm } from "@core/form/auto-form";
import type { AutoFormRef } from "@root/core/form/form.types";
import { SafeButton } from "@shared/components/button/safe-button";
import { id as getById } from "../api/order.api";
import { Section } from "@root/shared/components/ui/section";
import { CircularProgress } from "@mui/material";

function OrderDetailWidget() {
  const { orderId } = useParams();
  const frmOrderEditRef = React.useRef<AutoFormRef>(null);

  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<any | null>(null);

  // page information
  const isOriginal = detail?.codeLatest === detail?.code;
  const originalCodeLabel = !isOriginal ? ` ⬅ Mã gốc: ${detail?.code}` : '';
  const codeLabel = `Mã: ${detail?.codeLatest}${originalCodeLabel}`
  // title
  const title = `${codeLabel}`;

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!orderId) return;

      setLoading(true);

      try {
        const data = await getById(Number(orderId ?? 0));
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
            <IfPermission permissions={["order.edit"]}>
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
            name="order-edit-header"
            ref={frmOrderEditRef}
            initial={detail ?? { id: orderId }}
          />
        )}
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "order-detail-header",
  name: "order-detail:left",
  render: () => <OrderDetailWidget />,
  priority: 99,
});
