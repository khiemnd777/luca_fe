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
    customFields: null,
    latestOrderItemUpsert: {
      dto: {
        id: 0,
        orderId: 0,
        parentItemId: null,
        code: "",
        codeOriginal: "",
        remakeCount: 0,
        customFields: null,
        createdAt: "",
        updatedAt: "",
      }
    },
    latestOrderItem: {
      id: 0,
      orderId: 0,
      parentItemId: null,
      code: "",
      codeOriginal: "",
      remakeCount: 0,
      customFields: null,
      createdAt: "",
      updatedAt: "",
    },
    createdAt: "",
    updatedAt: "",
  }),
});
