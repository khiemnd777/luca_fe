import { mapper } from "@root/core/mapper/auto-mapper";
import type { OrderItemProcessInProgressProcessModel } from "../model/order-item-process-inprogress-process.model";

mapper.register<OrderItemProcessInProgressProcessModel>({
  name: "OrderItemProcessInProgressProcess",
  dtoToModelNaming: "snake_to_camel",
  modelToDtoNaming: "camel_to_snake",
  defaultModel: () => ({
    id: 0,
    note: null,
    assignedId: null,
    assignedName: null,
    startedAt: null,
    completedAt: null,
    processName: null,
    sectionName: null,
    color: null,
  }),
});
