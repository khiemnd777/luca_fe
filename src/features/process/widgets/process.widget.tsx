import { Button } from "@mui/material";
import { SectionCard } from "@root/shared/components/ui/section-card";
import AddIcon from '@mui/icons-material/Add';
import { openFormDialog } from "@core/form/form-dialog.service";
import { AutoTable } from "@core/table/auto-table";
import { registerSlot } from "@root/core/module/registry";
import { IfPermission } from "@root/core/auth/if-permission";

function SampleWidget() {
  return (
    <>
      <SectionCard extra={
        <>
          <IfPermission permissions={["process.create"]}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
              openFormDialog("process");
            }} >Thêm Công đoạn</Button>
          </IfPermission>
        </>
      }>
        <AutoTable name="process" />
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "process",
  name: "process:left",
  render: () => <SampleWidget />,
})
