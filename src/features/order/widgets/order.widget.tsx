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
      <SectionCard extra={
        <>
          <IfPermission permissions={["order.create"]}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
              openFormDialog("order");
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
})
