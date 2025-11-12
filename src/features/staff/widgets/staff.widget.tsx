import { Button } from "@mui/material";
import { SectionCard } from "@root/shared/components/ui/section-card";
import AddIcon from '@mui/icons-material/Add';
import { openFormDialog } from "@core/form/form-dialog.service";
import { AutoTable } from "@core/table/auto-table";
import { registerSlot } from "@root/core/module/registry";

function StaffWidget() {
  return (
    <>
      <SectionCard extra={
        <>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
            openFormDialog("staff-create");
          }} >Thêm nhân sự</Button>
        </>
      }>
        <AutoTable name="staffs" />
      </SectionCard>
    </>
  );
}

registerSlot({
  id: "staff",
  name: "staff:left",
  render: () => <StaffWidget />,
})
