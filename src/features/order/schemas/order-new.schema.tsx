import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, search, update } from "@features/order/api/order.api";
import type { OrderUpsertModel } from "@features/order/model/order.model";
import { alphabetSeq } from "@root/shared/utils/string.utils";
import { rel1 } from "@root/core/relation/relation.api";
import type { ProductModel } from "@root/features/product/model/product.model";

export function buildNewOrderSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      kind: "searchsingle",
      name: "code",
      label: "Mã đơn hàng",
      placeholder: "Nhập mã đơn hàng",
      fullWidth: true,
      pageLimit: 20,

      onBlur: async (text, matched, ctx) => {
        ctx?.setValue("code", text);
        if (matched) {
          const vid = matched.id;
          const result = await id(vid);
          if (result.latestOrderItem) {
            const seq = result.latestOrderItem.remakeCount + 1;
            result.latestOrderItem.remakeCount = seq;
            result.latestOrderItem.code = `${alphabetSeq(seq)}${matched.code}`;
            ctx?.setInitial(result);
          }
        } else {
          ctx?.setInitial({ code: text });
        }
      },

      getOptionLabel: (d: any) => d?.code,
      getOptionValue: (d: any) => d?.code,

      async searchPage(kw: string, page, limit) {
        const searched = await search({
          keyword: kw,
          limit: limit,
          page: page,
          orderBy: "code",
        });
        return searched.items;
      },


      async hydrateById(idValue: number | string, _) {
        if (!idValue) return null;
        const single = await id(idValue as number);
        return single ?? null;
      },
      async fetchOne(values: Record<string, any>) {
        const rawId = values.code;
        if (!rawId) return null;
        const single = await id(rawId);
        return single ?? null;
      },

      renderItem: (d: any) => (<>{d?.code}</>),
      disableDelete: (d: any) => d?.locked === true,
      autoLoadAllOnMount: true,
    },
    {
      name: "code",
      prop: "latestOrderItem",
      kind: "text",
      label: "Mã đơn làm lại",
      showIf: (values) => values["latestOrderItem.remakeCount"] > 0,
    },
    {
      name: "remakeCount",
      prop: "latestOrderItem",
      kind: "text",
      label: "Số lần làm lại",
      showIf: (values) => values["latestOrderItem.remakeCount"] > 0,
      disableIf: (_) => true,
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "order",
        mode: "whole",
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      prop: "latestOrderItem",
      metadata: {
        collection: "order-item-product",
        mode: "whole",
        groups: [
          {
            group: "product",
          }
        ],
        def: [
          {
            name: "productId",
            onBlur: async (text, matched, ctx) => {
              console.log(text, matched, ctx);
              if (matched) {
                const result: ProductModel = await rel1("order-product", matched.id);
                console.log(result);
                // don't need assign to productId and productName, because they are handled during submitting.
                // ctx?.setValue("latestOrderItem.customFields.productId", result.id);
                // ctx?.setValue("latestOrderItem.customFields.productName", result.name);
                ctx?.setValue("latestOrderItem.customFields.", result.id);
                if (result.customFields) {
                  ctx?.setValue("latestOrderItem.customFields.vat", result.customFields.vat);
                  ctx?.setValue("latestOrderItem.customFields.productCategory", result.customFields.category);
                  ctx?.setValue("latestOrderItem.customFields.retailPrice", result.customFields.retailPrice);
                }
              }
            },
          },
          {
            name: "productCategory",
            disableIf: () => true,
          }
        ],
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      prop: "latestOrderItem",
      metadata: {
        collection: "order-item-tooth",
        mode: "whole",
        groups: [
          {
            group: "product",
          },
        ]
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      prop: "latestOrderItem",
      metadata: {
        collection: "order-item-remake",
        mode: "whole",
        groups: [
          {
            group: "remake",
          }
        ],
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      prop: "latestOrderItem",
      metadata: {
        collection: "order-item",
        mode: "whole",
        groups: [
          {
            group: "price",
            fields: ["retailPrice", "quantity", "vat", "discountPrice"],
          },
          {
            group: "total-price",
            fields: ["totalPrice"],
          },
          {
            group: "status",
            fields: ["status", "priority"],
          },
          {
            group: "note",
            fields: ["note"],
          },
        ],
      }
    },
  ];

  return {
    idField: "id",
    fields,
    groups: [
      {
        name: "general",
        label: "Thông tin chung:",
        col: 2,
      },
      {
        name: "remake",
        col: 1,
      },
      {
        name: "note",
        col: 1,
      },
      {
        name: "status",
        col: 2,
      },
      {
        name: "product",
        label: "Sản phẩm:",
        col: 3,
      },
      {
        name: "price",
        label: "Giá:",
        col: 4,
      },
      {
        name: "total-price",
        col: 1,
      }
    ],
    modeResolver: (_) => {
      return "create";
    },
    submit: {
      create: {
        type: "fn",
        run: async (dto) => {
          await create(dto as OrderUpsertModel);
          return dto;
        },
      },
      update: {
        type: "fn",
        run: async (dto) => {
          await update(dto as OrderUpsertModel);
          return dto;
        },
      },
    },

    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo đơn hàng "${values?.name ?? ""}" thành công!`
          : `Cập nhật đơn hàng "${values?.name ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo đơn hàng "${values?.name ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật đơn hàng "${values?.name ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      if (data) {
        return await id(data.id);
      }
      return {};
    },

    async afterSaved() {
      reloadTable("orders");
    },

    hooks: {
      mapToDto: (v) => mapper.map("Order", v, "model_to_dto"),
    },
  };
}

registerForm("order-new", buildNewOrderSchema);

registerFormDialog("order-new", buildNewOrderSchema, {
  title: { create: "Tạo đơn hàng mới", update: "Cập nhật đơn hàng" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
