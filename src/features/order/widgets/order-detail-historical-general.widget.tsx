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
import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import type { OrderModel } from "../model/order.model";
import { useAsync } from "@root/core/hooks/use-async";
import { OrderProcessesStatusBoard } from "../components/order-process-status-board.component";
import { generateTitle } from "../utils/order.utils";
import { OrderInProgress } from "../components/order-inprogress.component";
import OrderAllProductsAndMaterials from "../components/order-all-products-and-materials.component";

function OrderDetailHistoricalGeneralWidget() {
  const { orderId, orderItemId } = useParams();
  const frmOrderEditRef = React.useRef<AutoFormRef>(null);
  const [tab, setTab] = React.useState<"info" | "qr" | "process" | "inprogress" | "all-products">("info");

  const { data: detail, loading } = useAsync<OrderModel | null>(
    () => {
      if (!orderId) return Promise.resolve(null);
      return getByOrderIdAndOrderItemId(Number(orderId ?? 0), Number(orderItemId ?? 0));
    },
    [orderId, orderItemId],
    { key: "order-detail-historical-body" }
  );

  const title = React.useMemo(
    () => generateTitle(detail?.code, detail?.latestOrderItem?.code),
    [detail?.code, detail?.latestOrderItem?.code]
  );

  React.useEffect(() => {
    setTab("info");
  }, [orderId, orderItemId]);

  return (
    <>
      <Section>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        >
          <Tab value="info" label="Thông tin đơn hàng" />
          <Tab value="qr" label="Mã QR" />
          <Tab value="process" label="Trạng thái" />
          <Tab value="inprogress" label="Tiến trình" />
          <Tab value="all-products" label="Tất cả Sản phẩm & Vật tư" />
        </Tabs>

        {tab === "info" && (
          <Box>
            {loading ? (
              <Section alignItems="center" py={2}>
                <CircularProgress size={22} />
              </Section>
            ) : (
              <SectionCard title={title ?? ""} extra={
                <>
                  <IfPermission permissions={["order.update"]}>
                    <SafeButton
                      variant="contained"
                      startIcon={<SaveOutlinedIcon />}
                      onClick={() => frmOrderEditRef.current?.submit()}
                    >
                      Lưu
                    </SafeButton>
                  </IfPermission>
                </>
              }>
                <AutoForm
                  name="order-historical"
                  ref={frmOrderEditRef}
                  initial={detail ?? { id: orderId }}
                />
              </SectionCard>
            )}
          </Box>
        )}

        {tab === "qr" && (
          <Box>
            <SectionCard title={title ?? ""}>
              <AutoForm name="order-qr" initial={detail} />
            </SectionCard>
          </Box>
        )}

        {tab === "process" && (
          <Box>
            <SectionCard title={title ?? ""}>
              <OrderProcessesStatusBoard />
            </SectionCard>
          </Box>
        )}

        {tab === "inprogress" && (
          <Box>
            <OrderInProgress />
          </Box>
        )}
        
        {tab === "all-products" && (
          <Box>
            <OrderAllProductsAndMaterials />
          </Box>
        )}
      </Section>
    </>
  );
}

registerSlot({
  id: "order-detail-historical",
  name: "order-detail-historical:left",
  render: () => <OrderDetailHistoricalGeneralWidget />,
  priority: 97,
});
