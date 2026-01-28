import { Button } from "@mui/material";
import { SectionCard } from "@root/shared/components/ui/section-card";
import AddIcon from '@mui/icons-material/Add';
import { openFormDialog } from "@core/form/form-dialog.service";
import { AutoTable } from "@core/table/auto-table";
import { registerSlot } from "@root/core/module/registry";
import { IfPermission } from "@root/core/auth/if-permission";

function RawMaterialWidget() {
  return (
    <>
      <SectionCard extra={
        <>
          <IfPermission permissions={["product.create"]}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
              openFormDialog("raw_material");
            }} >Thêm nguyên liệu</Button>
          </IfPermission>
        </>
      }>
        <AutoTable name="raw_materials" />
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "raw_material",
  name: "raw_material:left",
  render: () => <RawMaterialWidget />,
});
