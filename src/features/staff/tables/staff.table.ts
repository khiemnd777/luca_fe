import { registerTable } from "@core/table/table-registry";
import { createTableSchema, type ColumnDef, type FetchTableOpts } from "@core/table/table.types";
import { openFormDialog } from "@core/form/form-dialog.service";
import type { StaffModel } from "@features/staff/model/staff.model";
import { table, unlink } from "@features/staff/api/staff.api";
import { reloadTable } from "@core/table/table-reload";

const columns: ColumnDef<StaffModel>[] = [
  { key: "avatar", header: "Ảnh Đại Diện", type: "image", shape: "circle", width: 56 },
  { key: "name", header: "Tên Nhân Sự", sortable: true, labelField: true, width: 80 },
  { key: "email", header: "Email", sortable: true, width: 80 },
  { key: "phone", header: "Số Điện Thoại" },
  { key: "active", header: "Kích hoạt?", sortable: true, type: "boolean", },
  {
    key: "qrCode", header: "Mã QR", type: "qr", width: 56,
    qr: {
      size: 56,
      tooltipSize: 220,
      level: "M",
    }
  },
];

registerTable("staffs", () =>
  createTableSchema<StaffModel>({
    columns,
    fetch: async (opts: FetchTableOpts) => await table(opts),
    initialPageSize: 20,
    initialSort: { by: "id", dir: "asc" },
    onEdit(row) {
      openFormDialog("staff-non-password", { initial: { id: row.id } });
    },
    async onDelete(row) {
      await unlink(row.id);
      reloadTable("staffs");
    },
  })
);
