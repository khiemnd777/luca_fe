import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { uploadImages } from "@core/form/image-upload-utils";
import { mapper } from "@core/mapper/auto-mapper";
import { registerForm } from "@core/form/form-registry";
import type { StaffModel } from "@features/staff/model/staff.model";
import { create, existsEmail, existsPhone, id, update } from "@features/staff/api/staff.api";
import { reloadTable } from "@core/table/table-reload";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { search as searchSection, tableByStaffId } from "@features/staff/api/section.api";
import { openFormDialog } from "@core/form/form-dialog.service";

export function buildStaffNonPasswordSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "name",
      label: "Tên hiển thị",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập tên hiển thị",
        maxLength: 50,
      },
    },
    {
      name: "email",
      label: "Email",
      kind: "email",
      rules: {
        required: "Yêu cầu nhập địa chỉ email",
        maxLength: 300,
        async: async (val: string | null, { id }) => {
          if (!val) return null;
          const existed = await existsEmail({ id, email: val });
          return existed ? `Email ${val} đã tồn tại, vui lòng chọn email khác.` : null;
        }
      },
    },
    {
      name: "phone",
      label: "Số điện thoại",
      kind: "text",
      placeholder: "+84xxxxxxxxx",
      rules: {
        async: async (val: string | null, { id }) => {
          if (!val) return null;
          const ok = /^\+?\d{8,15}$/.test(val);
          if (!ok) {
            return "Sai định dạng số điện thoại";
          }
          const existed = await existsPhone({ id, phone: val });
          if (existed) {
            return `Số ${val} đã tồn tại, vui lòng chọn số khác.`;
          }
          return null;
        },
      },
      helperText: "Có thể nhập +84 hoặc không.",
    },
    {
      name: "avatar",
      label: "Ảnh đại diện",
      kind: "imageupload",
      accept: "image/*",
      maxFiles: 1,
      multipleFiles: false,
      helperText: "PNG/JPG ≤ 2MB. Khuyến nghị hình vuông.",
      uploader: uploadImages,
    },
    {
      name: "active",
      label: "Kích hoạt",
      kind: "switch",
      defaultValue: true,
    },
    {
      name: "sectionIds",
      label: "Bộ phận",
      kind: "searchlist",
      placeholder: "Tìm bộ phận nhận sự trực thuộc...",
      fullWidth: true,

      getOptionLabel: (d: any) => d.name,
      getOptionValue: (d: any) => d.id,

      async searchPage(kw: string, page, limit) {
        const searched = await searchSection({
          keyword: kw,
          limit: limit,
          page: page,
          orderBy: "name",
        });
        return searched.items;
      },

      pageLimit: 20,

      async hydrateByIds(ids: Array<number | string>, values: Record<string, any>) {
        if (!ids || ids.length === 0) return [];
        const table = await tableByStaffId(values.id, {
          limit: 20,
          page: 1,
          orderBy: "name",
        });
        const set = new Set(ids.map(String));
        return (table.items ?? []).filter((d: any) => set.has(String(d.id)));
      },

      async fetchList(values: Record<string, any>) {
        const table = await tableByStaffId(values.id, {
          limit: 20,
          page: 1,
          orderBy: "name",
        });
        return table.items;
      },

      renderItem: (d: any) => (
        <> {d.name} </>
      ),
      disableDelete: (d: any) => d.locked === true,
      onOpenCreate: () => openFormDialog("section"),
      autoLoadAllOnMount: true,
    }
  ];

  return {
    idField: "id",
    fields,
    submit: {
      create: {
        type: "fn",
        run: async (values) => {
          await create(values as StaffModel);
          return values;
        },
      },
      update: {
        type: "fn",
        run: async (values) => {
          await update(values as StaffModel);
          return values;
        },
      },
    },

    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo nhân sự "${values?.name ?? ""}" thành công!`
          : `Cập nhật nhân sự "${values?.name ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo nhân sự "${values?.name ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật nhân sự "${values?.name ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      if (data) {
        return await id(data.id);
      }
      return {};
    },

    async afterSaved() {
      reloadTable("staffs");
    },

    hooks: {
      mapToDto: (v) => mapper.map("Staff", v, "model_to_dto"),
    },
  };
}

registerForm("staff-non-password", buildStaffNonPasswordSchema);

registerFormDialog("staff-non-password", buildStaffNonPasswordSchema, {
  title: { create: "Thêm nhân sự", update: "Cập nhật nhân sự" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});