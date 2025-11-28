import { mapper } from "@root/core/mapper/auto-mapper";
import type { OrderModel } from "@features/order/model/order.model";

mapper.register<OrderModel>({
  name: "Order",
  dtoToModelNaming: "snake_to_camel",
  modelToDtoNaming: "camel_to_snake",
  defaultModel: () => ({
    id: 0,
    code: "",
    customFields: null,
    customerId: 0,
    customerName: "",
    statusLatest: "",
    codeLatest: "",
    priorityLatest: "",
    productId: 0,
    productName: "",
    quantity: 0,
    totalPrice: 0,
    deliveryDate: null,
    remakeCount: 0,
    remakeType: "",
    createdAt: "",
    updatedAt: "",
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
        // product
        productId: 0,
        productName: "",
      }
    },
    latestOrderItem: {
      // general
      id: 0,
      orderId: 0,
      parentItemId: null,
      customFields: null,
      createdAt: "",
      updatedAt: "",
      // order
      code: "",
      codeOriginal: "",
      remakeCount: 0,
      // product
      productId: 0,
      productName: "",
    },
  }),
});
