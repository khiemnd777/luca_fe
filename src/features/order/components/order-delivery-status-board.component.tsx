import { useParams } from "react-router-dom";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";

import { useAsync } from "@root/core/hooks/use-async";
import { Section } from "@root/shared/components/ui/section";
import ResponsiveStatusBoard from "@root/shared/components/status-board/responsive-status-board";
import { formatDateTime } from "@root/shared/utils/datetime.utils";
import {
  getDeliveryStatusByOrderItemId,
  id as getById,
  getByOrderIdAndOrderItemId,
  updateDeliveryStatus,
} from "../api/order.api";
import type { OrderItemModel } from "../model/order-item.model";

type DeliveryStatus = "pending" | "delivery_in_progress" | "delivered" | "returned";

type DeliveryBoardData = {
  orderId: number;
  orderItemId: number | null;
  order: any;
  orderItem: any;
  deliveryStatus: DeliveryStatus;
};

const statusOptions = [
  { label: "Chờ giao", value: "pending" },
  { label: "Đang giao", value: "delivery_in_progress" },
  { label: "Đã trả về", value: "returned" },
  { label: "Đã nhận", value: "delivered" },
];

export function OrderDetailDeliveryStatusBoard() {
  const { orderId, orderItemId } = useParams();

  const { data, loading } = useAsync<DeliveryBoardData | null>(() => {
    return (async () => {
      if (!orderId) return null;
      const orderIdNumber = Number(orderId);

      if (orderItemId) {
        const orderItemIdNumber = Number(orderItemId);
        const [detail, deliveryStatus] = await Promise.all([
          getByOrderIdAndOrderItemId(orderIdNumber, orderItemIdNumber),
          getDeliveryStatusByOrderItemId(orderIdNumber, orderItemIdNumber),
        ]);
        const item = detail?.latestOrderItem ?? detail?.latestOrderItemUpsert ?? null;
        const realOrderItemId = (item as OrderItemModel)?.id ?? orderItemIdNumber;
        return {
          orderId: orderIdNumber,
          orderItemId: realOrderItemId ?? null,
          order: detail,
          orderItem: item,
          deliveryStatus: (deliveryStatus ?? "pending") as DeliveryStatus,
        };
      }

      const detail = await getById(orderIdNumber);
      const item = detail?.latestOrderItem ?? detail?.latestOrderItemUpsert ?? null;
      const realOrderItemId = (item as OrderItemModel)?.id ?? null;
      const deliveryStatus = realOrderItemId
        ? await getDeliveryStatusByOrderItemId(orderIdNumber, realOrderItemId)
        : "pending";
      return {
        orderId: orderIdNumber,
        orderItemId: realOrderItemId,
        order: detail,
        orderItem: item,
        deliveryStatus: (deliveryStatus ?? "pending") as DeliveryStatus,
      };
    })();
  }, [orderId, orderItemId], {
    key: `order-delivery-status:${orderId ?? "new"}:${orderItemId ?? "latest"}`,
  });

  const deliveryStatus = data?.orderItemId
    ? data.deliveryStatus ?? "pending"
    : "pending";

  const items = data?.orderItemId
    ? [
      {
        id: data.orderItemId,
        status: deliveryStatus,
        obj: data,
      },
    ]
    : [];

  return (
    <Section>
      {loading && (
        <Stack alignItems="center" py={2}>
          <CircularProgress size={22} />
        </Stack>
      )}

      {!loading && items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          Không có thông tin giao/nhận hàng.
        </Typography>
      )}

      {!loading && items.length > 0 && (
        <ResponsiveStatusBoard
          items={items}
          statuses={statusOptions}
          renderCard={(_id, _status, payload) => {
            const detail = payload.order;
            const item = payload.orderItem;
            const code = detail?.codeLatest ?? detail?.code ?? item?.code;
            const deliveryDate = detail?.deliveryDate ?? item?.deliveryDate;
            return (
              <Stack spacing={1}>
                {code && (
                  <Typography fontWeight={700}>{code}</Typography>
                )}
                {item?.productName && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Inventory2OutlinedIcon fontSize="small" />
                    <Typography>{item.productName}</Typography>
                  </Stack>
                )}
                {deliveryDate && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocalShippingIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2">
                        {formatDateTime(deliveryDate)}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </Stack>
            );
          }}
          onStatusChange={async (_id, newStatus, _oldStatus, payload) => {
            if (!payload.orderId || !payload.orderItemId) return;
            await updateDeliveryStatus(payload.orderId, payload.orderItemId, newStatus);
          }}
        />
      )}
    </Section>
  );
}
