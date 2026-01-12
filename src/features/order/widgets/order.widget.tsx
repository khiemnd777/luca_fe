import { Button } from "@mui/material";
import { SectionCard } from "@root/shared/components/ui/section-card";
import AddIcon from '@mui/icons-material/Add';
import { openFormDialog } from "@core/form/form-dialog.service";
import { AutoTable } from "@core/table/auto-table";
import { registerSlot } from "@root/core/module/registry";
import { IfPermission } from "@root/core/auth/if-permission";

function OrderWidget() {
  return (
    <>
      <SectionCard title="Tất cả" extra={
        <>
          <IfPermission permissions={["order.create"]}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
              openFormDialog("order-new");
            }} >Tạo đơn hàng mới</Button>
          </IfPermission>
        </>
      }>
        <AutoTable name="orders" />
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "order",
  name: "order:left",
  render: () => <OrderWidget />,
});

registerSlot({
  id: "order-inprogress",
  name: "order:top",
  render: () => (
    <>
      <SectionCard title="Đang gia công">
        <AutoTable name="order-inprogress" />
      </SectionCard>
    </>
  ),
  priority: 1,
});

registerSlot({
  id: "order-newest",
  name: "order:top",
  render: () => (
    <>
      <SectionCard title="Đơn mới">
        <AutoTable name="order-newest" />
      </SectionCard>
    </>
  ),
  priority: 2,
});
