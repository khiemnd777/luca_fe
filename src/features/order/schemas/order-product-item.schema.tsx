import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerForm } from "@core/form/form-registry";
import { id as fetchProductById, search as searchProduct } from "@features/product/api/product.api";
import type { ProductModel } from "@features/product/model/product.model";

const productLabel = (p?: ProductModel | null) => {
  if (!p) return "";
  const code = p.code ?? "";
  const name = p.name ?? "";
  if (code && name) return `${code} → ${name}`;
  return code || name;
};

export function buildOrderProductItemSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "productId",
      label: "Sản phẩm",
      kind: "searchsingle",
      placeholder: "Nhập mã hoặc tên sản phẩm",
      fullWidth: true,
      size: "small",
      pageLimit: 50,
      rules: {
        required: "Vui lòng chọn sản phẩm",
      },
      getOptionLabel: (p: ProductModel) => productLabel(p),
      getInputLabel: (p: ProductModel) => p?.code ?? "",
      async searchPage(keyword: string, page: number, limit: number) {
        const result = await searchProduct({
          keyword,
          limit,
          page,
          orderBy: "code",
        });
        return result.items;
      },
      async hydrateById(idValue: number | string) {
        if (!idValue) return null;
        return await fetchProductById(Number(idValue));
      },
      async fetchOne(values: Record<string, any>) {
        const key = values.productId ?? values.productCode;
        if (!key) return null;
        if (typeof key === "number") return await fetchProductById(key);
        const result = await searchProduct({
          keyword: String(key),
          limit: 1,
          page: 1,
          orderBy: "code",
        });
        return result.items?.[0] ?? null;
      },
      onBlur: (text: string, matched: any, ctx) => {
        const product = matched as ProductModel | null;
        ctx?.setValue("productCode", product?.code ?? text ?? "");
        ctx?.setValue("productId", product?.id ?? null);
        if (product?.customFields?.retailPrice != null) {
          ctx?.setValue("retailPrice", product.customFields.retailPrice);
        }
      },
    },
    {
      name: "quantity",
      label: "Số lượng",
      kind: "number",
      size: "small",
      defaultValue: 1,
      rules: {
        required: "Vui lòng nhập số lượng",
        min: 1,
      },
    },
    {
      name: "retailPrice",
      label: "Giá bán lẻ",
      kind: "currency",
      size: "small",
      rules: {
        min: 0,
      },
    },
  ];

  return {
    idField: "id",
    fields,
    submit: {
      type: "fn",
      run: async (values) => values,
    },
    onChange: (_name, _value, ctx) => {
      const cb = (ctx?.values as any)?.__onChange;
      if (typeof cb === "function") cb(ctx?.values ?? {});
    },
    groups: [
      {
        name: "general",
        col: 3,
      },
    ],
  };
}

registerForm("order-product-item", buildOrderProductItemSchema);
