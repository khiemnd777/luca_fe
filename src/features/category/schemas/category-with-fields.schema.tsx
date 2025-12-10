import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef, FormContext } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, update, search as searchCategory } from "@features/category/api/category.api";
import type { CategoryModel, CategoryUpsertModel } from "@features/category/model/category.model";
import { SectionCard } from "@root/shared/components/ui/section-card";
import { IfPermission } from "@root/core/auth/if-permission";
import { Button } from "@mui/material";
import { openFormDialog } from "@root/core/form/form-dialog.service";
import { AutoTable } from "@root/core/table/auto-table";
import AddIcon from '@mui/icons-material/Add';

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
      getOptionLabel: (d: CategoryModel) => d?.name ?? "",
      getOptionValue: (d: CategoryModel) => d?.id,
      async search(kw: string) {
        const result = await searchCategory({
          keyword: kw,
          limit: 20,
          page: 1,
          orderBy: "parent_id",
        });
        return result.items;
      },
      async searchPage(kw: string, page, limit) {
        const result = await searchCategory({
          keyword: kw,
          limit,
          page,
          orderBy: "parent_id",
        });
        return result.items;
      },
      async hydrateByIds(ids) {
        if (!ids?.length) return [];
        const parent = await id(Number(ids[0]));
        return parent ? [parent] : [];
      },
      async fetchList(values: Record<string, any>) {
        const pid = values.parentId;
        if (!pid || (Array.isArray(pid) && !pid.length)) return [];
        const parent = await id(pid);
        return parent ? [parent] : [];
      },
      onBlur: (_, matched, ctx) => {
        const parent = matched as CategoryModel | null;
        const id = ctx?.values.id;
        const prevParentId = ctx?.values.parentId;
        if (parent && parent.id === id) {
          ctx?.setFieldError("parentId", "Không thể chọn chính danh mục này làm cha");
          ctx?.setValue("parentId", prevParentId);
          return;
        }

        const level = ctx?.values.level ?? 1;
        if (parent && parent.level! > level) {
          ctx?.setFieldError("parentId", "Không thể chọn danh mục cấp thấp hơn hoặc ngang bằng làm cha");
          ctx?.setValue("parentId", prevParentId);
          return;
        }

        ctx?.setFieldError("parentId", null);

        syncParentInfo(parent, ctx);
      },
      pageLimit: 20,
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
      }
    },
    {
      name: "collectionId",
      label: "",
      kind: "custom",
      render: (ctx) => {
        const collectionId: number | null = (ctx.value ?? null);
        return (
          <SectionCard title="Manage fields" extra={
            <>
              <IfPermission permissions={["privilege.metadata"]}>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
                  openFormDialog("metadata-field", {
                    initial: { collectionId },
                  });
                }} >New Field</Button>
              </IfPermission>
            </>
          }>
            <AutoTable name="metadata-fields" params={{ collectionId }} />
          </SectionCard>
        );
      }
    }
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

registerForm("category-with-fields", buildCategorySchema);
