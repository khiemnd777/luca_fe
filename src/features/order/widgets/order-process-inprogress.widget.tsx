import React from "react";
import { registerSlot } from "@core/module/registry";
import { useParams } from "react-router-dom";
import { SectionCard } from "@shared/components/ui/section-card";
import { IfPermission } from "@core/auth/if-permission";
import { SafeButton } from "@shared/components/button/safe-button";
import { AutoForm } from "@core/form/auto-form";
import type { AutoFormRef } from "@root/core/form/form.types";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useAsync } from "@root/core/hooks/use-async";
import { Section } from "@root/shared/components/ui/section";
import { getByOrderIdAndOrderItemId } from "../api/order.api";
import { getInProgressesByOrderItemId } from "../api/order-item-process.api";
import type { OrderItemProcessInProgressProcessModel } from "../model/order-item-process-inprogress-process.model";
import type { OrderModel } from "../model/order.model";
import { generateTitle } from "../utils/order.utils";

export function OrderProcessInProgressWidget() {
  const { orderId, orderItemId } = useParams();
  const frmCurrentRef = React.useRef<AutoFormRef>(null);

  const { data: detail, loading: loadingDetail } = useAsync<OrderModel | null>(
    () => {
      if (!orderId || !orderItemId) return Promise.resolve(null);
      return getByOrderIdAndOrderItemId(Number(orderId), Number(orderItemId));
    },
    [orderId, orderItemId],
    {
      key: `order-process-inprogress-detail:${orderId ?? ""}:${orderItemId ?? ""}`,
    }
  );

  const title = React.useMemo(() => {
    const codeTitle = generateTitle(detail?.code, detail?.latestOrderItem?.code);
    return codeTitle ? `Đơn hàng ${codeTitle}` : "Đơn hàng";
  }, [detail?.code, detail?.latestOrderItem?.code]);

  const { data: inprogressesData, loading: loadingInprogresses } =
    useAsync<OrderItemProcessInProgressProcessModel[]>(
      () => {
        if (!orderId || !orderItemId) return Promise.resolve([]);
        return getInProgressesByOrderItemId(Number(orderId), Number(orderItemId));
      },
      [orderId, orderItemId],
      {
        key: `order-process-inprogress:${orderId ?? ""}:${orderItemId ?? ""}`,
      }
    );

  const latestData = inprogressesData?.[0];
  const previousData = (inprogressesData ?? []).slice(1);

  return (
    <Stack spacing={2}>
      <Section>
        {loadingDetail ? (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={22} />
          </Stack>
        ) : (
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
        )}
      </Section>

      <SectionCard
        title="Công đoạn hiện tại"
        extra={
          <IfPermission permissions={["order.update"]}>
            <SafeButton
              variant="contained"
              onClick={() => frmCurrentRef.current?.submit()}
            >
              Cập nhật
            </SafeButton>
          </IfPermission>
        }
      >
        {loadingInprogresses ? (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={22} />
          </Stack>
        ) : (
          <AutoForm
            name="order-process-inprogress-current"
            ref={frmCurrentRef}
            initial={latestData ?? {}}
          />
        )}
      </SectionCard>

      <SectionCard title="Các công đoạn trước">
        {loadingInprogresses ? (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={22} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            {previousData.map((item, idx) => (
              <Section key={item.id ?? idx}>
                <AutoForm
                  name="order-process-inprogress-prev"
                  initial={item ?? {}}
                />
              </Section>
            ))}
            {previousData.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Không có dữ liệu
              </Typography>
            )}
          </Stack>
        )}
      </SectionCard>
    </Stack>
  );
}

registerSlot({
  id: "order-process-inprogress",
  name: "order-process-inprogress:left",
  priority: 99,
  render: () => <OrderProcessInProgressWidget />,
});
