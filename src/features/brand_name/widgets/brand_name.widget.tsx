import { Button } from "@mui/material";
import { SectionCard } from "@root/shared/components/ui/section-card";
import AddIcon from '@mui/icons-material/Add';
import { openFormDialog } from "@core/form/form-dialog.service";
import { AutoTable } from "@core/table/auto-table";
import { registerSlot } from "@root/core/module/registry";
import { IfPermission } from "@root/core/auth/if-permission";

function BrandNameWidget() {
  return (
    <>
      <SectionCard extra={
        <>
          <IfPermission permissions={["product.create"]}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
              openFormDialog("brand_name");
            }} >Thêm thương hiệu</Button>
          </IfPermission>
        </>
      }>
        <AutoTable name="brand_names" />
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "brand_name",
  name: "brand_name:left",
  render: () => <BrandNameWidget />,
});
