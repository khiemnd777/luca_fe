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
import { Box, CircularProgress, Tab, Tabs } from "@mui/material";
import { useAsync } from "@root/core/hooks/use-async";
import { OrderProcessesStatusBoard } from "../components/order-process-status-board.component";
import { generateTitle } from "../utils/order.utils";
import { OrderProcessInProgress } from "../components/order-process-inprogress.component";

function OrderDetailBodyWidget() {
  const { orderId } = useParams();
  const frmOrderEditRef = React.useRef<AutoFormRef>(null);
  const [tab, setTab] = React.useState<"info" | "qr" | "process" | "inprogress">("info");

  const { data: detail, loading } = useAsync<any>(() => {
    if (!orderId) return Promise.resolve(null);
    return getById(Number(orderId ?? 0));
  }, [orderId], {
    key: `order-detail:${orderId ?? "new"}`,
  });

  const title = React.useMemo(
    () => generateTitle(detail?.code, detail?.codeLatest),
    [detail?.code, detail?.codeLatest]
  );

  React.useEffect(() => {
    setTab("info");
  }, [orderId]);

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
        </Tabs>

        <Box hidden={tab !== "info"}>
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
                name="order-edit"
                ref={frmOrderEditRef}
                initial={detail ?? { id: orderId }}
              />
            </SectionCard>
          )}
        </Box>

        <Box hidden={tab !== "qr"}>
          <SectionCard title={title ?? ""}>
            <AutoForm name="order-qr" initial={detail} />
          </SectionCard>
        </Box>

        <Box hidden={tab !== "process"}>
          <SectionCard title={title ?? ""}>
            <OrderProcessesStatusBoard />
          </SectionCard>
        </Box>

        <Box hidden={tab !== "inprogress"}>
          <OrderProcessInProgress />
        </Box>
      </Section>
    </>
  );
}

registerSlot({
  id: "order-detail",
  name: "order-detail:left",
  render: () => <OrderDetailBodyWidget />,
  priority: 97,
});
