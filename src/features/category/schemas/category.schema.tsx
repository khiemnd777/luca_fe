import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef, FormContext } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, update } from "@features/category/api/category.api";
import type { CategoryModel, CategoryUpsertModel } from "@features/category/model/category.model";
import { categoryProps } from "../utils/category.utils";
import { validateParentCategorySelection } from "../utils/category.validate";
import { processProps } from "@root/features/process/utils/process.props";

export function buildCategorySchema(): FormSchema {
  const syncParentInfo = (parent: CategoryModel | null, ctx?: FormContext | null) => {
    const nextLevel = (parent?.level ?? 0) + 1;
    ctx?.setValue("level", nextLevel);
    ctx?.setValue("parentId", parent?.id ?? null);

    const lv1Id = parent?.categoryIdLv1 ?? (parent?.level === 1 ? parent.id : null);
    const lv1Name = parent?.categoryNameLv1 ?? (parent?.level === 1 ? parent.name : null);
    const lv2Id = parent?.categoryIdLv2 ?? (parent?.level === 2 ? parent.id : null);
    const lv2Name = parent?.categoryNameLv2 ?? (parent?.level === 2 ? parent.name : null);
    const lv3Id = parent?.categoryIdLv3 ?? (parent?.level === 3 ? parent.id : null);
    const lv3Name = parent?.categoryNameLv3 ?? (parent?.level === 3 ? parent.name : null);

    ctx?.setValue("categoryIdLv1", lv1Id ?? null);
    ctx?.setValue("categoryNameLv1", lv1Name ?? null);
    ctx?.setValue("categoryIdLv2", lv2Id ?? null);
    ctx?.setValue("categoryNameLv2", lv2Name ?? null);
    ctx?.setValue("categoryIdLv3", lv3Id ?? null);
    ctx?.setValue("categoryNameLv3", lv3Name ?? null);
  };

  const fields: FieldDef[] = [
    {
      name: "name",
      label: "Tên danh mục",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập tên danh mục",
        maxLength: 200,
      },
    },
    {
      name: "parentId",
      label: "Danh mục cha",
      kind: "searchsingle",
      placeholder: "Chọn danh mục cha",
      pageLimit: 20,
      ...categoryProps,
      onBlur: (_, matched, ctx) => {
        const parent = matched as CategoryModel | null;
        const prevParentId = ctx?.values.parentId;
        const error = validateParentCategorySelection(parent, ctx?.values);
        if (error) {
          ctx?.setFieldError("parentId", error);
          ctx?.setValue("parentId", prevParentId);
          return;
        }

        ctx?.setFieldError("parentId", null);

        syncParentInfo(parent, ctx);
      },
    },
    {
      name: "level",
      label: "Cấp",
      kind: "number",
      defaultValue: 1,
      disableIf: () => true,
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "category",
        mode: "whole",
        def: [
          {
            name: "processIds",
            ...processProps,
          },
        ],
      }
    },
  ];

  return {
    idField: "id",
    fields,
    submit: {
      create: {
        type: "fn",
        run: async (dto, _) => {
          await create(dto as CategoryUpsertModel);
          return dto;
        },
      },
      update: {
        type: "fn",
        run: async (dto, _) => {
          await update(dto as CategoryUpsertModel);
          return dto;
        },
      },
    },

    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo danh mục "${values?.name ?? ""}" thành công!`
          : `Cập nhật danh mục "${values?.name ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo danh mục "${values?.name ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật danh mục "${values?.name ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      if (data) {
        return await id(data.id);
      }
      return {};
    },

    async afterSaved() {
      reloadTable("categories");
    },

    hooks: {
      mapToDto: (v) => mapper.map("Category", v, "model_to_dto"),
    },
  };
}

registerForm("category", buildCategorySchema);

registerFormDialog("category", buildCategorySchema, {
  title: { create: "Thêm danh mục", update: "Cập nhật danh mục" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
