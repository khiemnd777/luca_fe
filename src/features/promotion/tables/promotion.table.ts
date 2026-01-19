import { registerTable } from "@core/table/table-registry";
import { createTableSchema, type ColumnDef, type FetchTableOpts } from "@core/table/table.types";
import { reloadTable } from "@core/table/table-reload";
import { openFormDialog } from "@core/form/form-dialog.service";
import { navigate } from "@root/core/navigation/navigate";
import { list, remove } from "@features/promotion/api/promotion.api";
import type { PromotionCodeModel } from "@features/promotion/model/promotion.model";

const columns: ColumnDef<PromotionCodeModel>[] = [
  { key: "code", header: "Mã khuyến mãi", sortable: true, labelField: true },
  { key: "name", header: "Tên khuyến mãi", sortable: true },
  { key: "discountType", header: "Loại", sortable: true },
  { key: "discountValue", header: "Giá trị giảm", sortable: true, type: "number" },
  { key: "startAt", header: "Bắt đầu", sortable: true, type: "datetime" },
  { key: "endAt", header: "Kết thúc", sortable: true, type: "datetime" },
  { key: "isActive", header: "Kích hoạt", type: "boolean" },
];

registerTable("promotions", () => {
  return createTableSchema<PromotionCodeModel>({
    columns,
    fetch: async (opts: FetchTableOpts) => await list(opts),
    initialPageSize: 10,
    initialSort: { by: "id", dir: "asc" },
    allowUpdating: ["promotion.update"],
    allowDeleting: ["promotion.delete"],
    onEdit(row: PromotionCodeModel) {
      openFormDialog("promotion", { initial: { id: row.id } });
    },
    onView(row: PromotionCodeModel) {
      navigate(`/promotion/${row.id}`);
    },
    async onDelete(row) {
      await remove(row.id);
      reloadTable("promotions");
    },
  });
});
