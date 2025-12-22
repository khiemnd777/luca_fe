import React from "react";
import { registerSlot } from "@core/module/registry";
import { SectionCard } from "@shared/components/ui/section-card";
import { IfPermission } from "@core/auth/if-permission";
import { SafeButton } from "@shared/components/button/safe-button";
import { useParams } from "react-router-dom";
import { AutoForm } from "@core/form/auto-form";
import type { AutoFormRef } from "@root/core/form/form.types";
import { useAsync } from "@root/core/hooks/use-async";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { getCheckoutLatest, prepareCheckInOrOutByCode } from "../api/order-item-process.api";
import type { OrderItemProcessInProgressModel } from "../model/order-item-process-inprogress.model";
import type { OrderItemProcessInProgressProcessModel } from "../model/order-item-process-inprogress-process.model";
import { OrderQrScanner } from "../components/order-scanner.component";
import { Spacer } from "@root/shared/components/ui/spacer";
import InputIcon from '@mui/icons-material/Input';
import OutputIcon from '@mui/icons-material/Output';
import { Section } from "@root/shared/components/ui/section";

export function OrderProcessCheckCodeWidget() {
  const { code } = useParams();
  const [orderCode, setOrderCode] = React.useState<string | undefined>(code);
  const frmProcessCheckInOrOutRef = React.useRef<AutoFormRef>(null);

  React.useEffect(() => {
    if (code) {
      setOrderCode(code);
    }
  }, [code]);

  const { data: preparedData, loading: loadingPrepared } =
    useAsync<OrderItemProcessInProgressModel | null>(() => {
      if (!orderCode) return Promise.resolve(null);
      return prepareCheckInOrOutByCode(orderCode);
    }, [orderCode], {
      key: `order-process-check-code:${orderCode ?? ""}`,
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
  const header = "Hiện tại";

  const title = React.useMemo(() => {
    const codeTitle = preparedData?.orderItemCode;
    return codeTitle ? `Mã: ${codeTitle}` : "Đơn hàng";
  }, [preparedData?.orderItemCode]);

  return (
    <>
      {preparedData ? (
        <>
          <Section>
            {loadingPrepared ? (
              <Stack alignItems="center" py={2}>
                <CircularProgress size={22} />
              </Stack>
            ) : (
              <Typography variant="subtitle1" fontWeight={700}>
                {title}
              </Typography>
            )}
          </Section>
          <Spacer />
          <SectionCard
            title={header}
            extra={
              <>
                <IfPermission permissions={["order.update"]}>
                  <SafeButton
                    variant="contained"
                    icon={isCheckout ? <OutputIcon /> : <InputIcon />}
                    onClick={() => frmProcessCheckInOrOutRef.current?.submit()}
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
                name={isCheckout ? 'order-process-inprogress-check-out' : 'order-process-inprogress-check-in'}
                ref={frmProcessCheckInOrOutRef}
                initial={preparedData ?? {}}
              />
            )}
          </SectionCard>
          <Spacer />
          {loadingCheckoutLatest || checkoutLatestData?.id ? (
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
          ) : null}
        </>
      ) : <OrderQrScanner onDetected={(nextCode) => setOrderCode(nextCode)} />}
    </>
  );
}

registerSlot({
  id: "order-process-check-code",
  name: "order-process-check-code:left",
  priority: 99,
  render: () => <OrderProcessCheckCodeWidget />,
});
