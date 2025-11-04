import type { FieldDef } from "@core/form/types";

export function buildDepartmentSettingsSchema(): FieldDef[] {
  return [
    {
      name: "name",
      label: "Tên công ty",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập tên",
        minLength: 2,
        maxLength: 120,
      },
    },
    {
      name: "address",
      label: "Địa chỉ",
      kind: "text",
      rules: { maxLength: 300 },
    },
    {
      name: "phoneNumber",
      label: "Số điện thoại",
      kind: "text",
      placeholder: "+84xxxxxxxxx",
      rules: {
        async: async (val: string | null) => {
          if (!val) return null;
          const ok = /^\+?\d{8,15}$/.test(val);
          return ok ? null : "Invalid phone number";
        },
      },
      helperText: "Có thể nhập +84 hoặc không.",
    },
    {
      name: "logo",
      label: "Logo",
      kind: "imageupload",
      accept: "image/*",
      maxFiles: 1,
      multipleFiles: false,
      helperText: "PNG/JPG ≤ 2MB. Khuyến nghị hình vuông.",
      uploader: async (_: File[]) => {
        // TODO: thay bằng uploader thật
        await new Promise((r) => setTimeout(r, 200));
        return ["https://api.dicebear.com/9.x/initials/svg?seed=Dept"];
      },
    },
    {
      name: "active",
      label: "Kích hoạt",
      kind: "switch",
    },
  ];
}
