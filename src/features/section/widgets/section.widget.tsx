import { Button } from "@mui/material";
import { SectionCard } from "@root/shared/components/ui/section-card";
import AddIcon from '@mui/icons-material/Add';
import { openFormDialog } from "@core/form/form-dialog.service";
import { AutoTable } from "@core/table/auto-table";
import { registerSlot } from "@core/module/registry";
import { IfPermission } from "@core/auth/if-permission";

function SectionWidget() {
  return (
    <>
      <SectionCard extra={
        <IfPermission permissions={["staff.create"]}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
            openFormDialog("section");
          }} >Thêm bộ phận</Button>
        </IfPermission>
      }>
        <AutoTable name="sections" />
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "section",
  name: "section:left",
  render: () => <SectionWidget />,
})
