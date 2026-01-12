import { registerTable } from "@core/table/table-registry";
import { createTableSchema, type ColumnDef, type FetchTableOpts } from "@core/table/table.types";
import type { InProgressOrderModel } from "@features/order/model/inprogress-order.model";
import { inProgressList } from "@features/order/api/order.api";
import { priorityColor, priorityLabel } from "@root/shared/utils/order.utils";
import { navigate } from "@root/core/navigation/navigate";
import { useWebSocket } from "@root/core/network/websocket/use-web-socket";
import { useEffect } from "react";
import { invalidate } from "@root/core/hooks/use-async";
import { registerWS } from "@root/core/network/websocket/ws-widgets";

const columns: ColumnDef<InProgressOrderModel>[] = [
  // {
  //   key: "statusLatest",
  //   type: "color",
  //   width: 110,
  //   accessor: (row) => ({ text: statusLabel(row.statusLatest), color: statusColor(row.statusLatest) }),
  // },
  {
    key: "priorityLatest",
    type: "color",
    width: 95,
    accessor: (row) => ({ text: priorityLabel(row.priorityLatest), color: priorityColor(row.priorityLatest) }),
  },
  { key: "codeLatest", header: "Mã đơn hàng", labelField: true },
  // { key: "code", header: "Mã gốc" },
  { key: "deliveryDate", header: "Ngày giao", type: "datetime" },
];

registerTable("order-inprogress", () => {
  return createTableSchema<InProgressOrderModel>({
    columns,
    fetch: async (opts: FetchTableOpts) => await inProgressList(opts),
    initialPageSize: 10,
    initialSort: { by: "delivery_date", dir: "asc" },
    onView: (row: InProgressOrderModel) => { navigate(`/order/${row.id}`) },
  });
});


function InProgressOrderWSWidget() {
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === "order:inprogress") {
      invalidate("order-inprogress");
    }
  }, [lastMessage]);

  return null;
}

registerWS(<InProgressOrderWSWidget />);
