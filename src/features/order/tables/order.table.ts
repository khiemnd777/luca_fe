import { registerTable } from "@core/table/table-registry";
import { createTableSchema, type ColumnDef, type FetchTableOpts } from "@core/table/table.types";
import { reloadTable } from "@core/table/table-reload";
import { openFormDialog } from "@core/form/form-dialog.service";
import type { OrderModel } from "@features/order/model/order.model";
import { table, unlink } from "@features/order/api/order.api";

const columns: ColumnDef<OrderModel>[] = [
  { key: "code", header: "Mã đơn hàng", sortable: true, },
  {
    key: "",
    type: "metadata",
    metadata: {
      collection: "order",
      mode: "whole",
    }
  },
];

registerTable("orders", () => {
  return createTableSchema<OrderModel>({
    columns,
    fetch: async (opts: FetchTableOpts) => await table(opts),
    initialPageSize: 10,
    initialSort: { by: "id", dir: "asc" },
    allowUpdating: ["order.update"],
    allowDeleting: ["order.delete"],
    onEdit(row: OrderModel) {
      openFormDialog("order", { initial: { id: row.id } });
    },
    async onDelete(row) {
      await unlink(row.id);
      reloadTable("orders");
    },
  });
});
