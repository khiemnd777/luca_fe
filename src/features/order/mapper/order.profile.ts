import { mapper } from "@root/core/mapper/auto-mapper";
import type { OrderModel } from "@features/order/model/order.model";

mapper.register<OrderModel>({
  name: "Order",
  dtoToModelNaming: "snake_to_camel",
  modelToDtoNaming: "camel_to_snake",
  defaultModel: () => ({
    id: 0,
    code: "",
    name: "",
    active: true,
    customFields: null,
  }),
});
