import React from "react";
import { registerSlot } from "@core/module/registry";
import { SectionCard } from "@shared/components/ui/section-card";
import { IfPermission } from "@core/auth/if-permission";
import { SafeButton } from "@shared/components/button/safe-button";
import { useParams } from "react-router-dom";
import { AutoForm } from "@core/form/auto-form";
import type { AutoFormRef } from "@root/core/form/form.types";
import { useAsync } from "@root/core/hooks/use-async";
import { CircularProgress, Stack } from "@mui/material";
import { getCheckoutLatest, prepareCheckInOrOutByCode } from "../api/order-item-process.api";
import type { OrderItemProcessInProgressModel } from "../model/order-item-process-inprogress.model";
import type { OrderItemProcessInProgressProcessModel } from "../model/order-item-process-inprogress-process.model";

export function OrderProcessCheckCodeWidget() {
  const { code } = useParams();
  const frmProcessCheckoutRef = React.useRef<AutoFormRef>(null);

  const { data: preparedData, loading: loadingPrepared } =
    useAsync<OrderItemProcessInProgressModel | null>(() => {
      if (!code) return Promise.resolve(null);
      return prepareCheckInOrOutByCode(code);
    }, [code], {
      key: `order-process-check-code:${code ?? ""}`,
    });

  const { data: checkoutLatestData, loading: loadingCheckoutLatest } =
    useAsync<OrderItemProcessInProgressProcessModel | null>(() => {
      if (!preparedData?.orderId || !preparedData?.orderItemId) {
        return Promise.resolve(null);
      }
      return getCheckoutLatest(preparedData.orderId, preparedData.orderItemId);
    }, [preparedData?.orderId, preparedData?.orderItemId], {
      key: `order-process-check-code-latest:${preparedData?.orderId ?? ""}:${preparedData?.orderItemId ?? ""}`,
    });

  const isCheckout = Boolean(preparedData?.id);
  const title = isCheckout ? "Check out" : "Check in";

  return (
    <>
      <SectionCard
        title={title ?? ""}
        extra={
          <>
            <IfPermission permissions={["order.update"]}>
              <SafeButton
                variant="contained"
                onClick={() => frmProcessCheckoutRef.current?.submit()}
              >
                {isCheckout ? "Check out" : "Check in"}
              </SafeButton>
            </IfPermission>
          </>
        }
      >
        {loadingPrepared ? (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={22} />
          </Stack>
        ) : (
          <AutoForm
            name="order-process-inprogress"
            ref={frmProcessCheckoutRef}
            initial={preparedData ?? {}}
          />
        )}
      </SectionCard>

      <SectionCard title="Công đoạn trước">
        {loadingCheckoutLatest ? (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={22} />
          </Stack>
        ) : (
          <AutoForm
            name="order-process-inprogress-prev"
            initial={checkoutLatestData ?? {}}
          />
        )}
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "order-process-check-code",
  name: "order-process-check-code:left",
  priority: 99,
  render: () => <OrderProcessCheckCodeWidget />,
});
