import type { FieldDef } from "@core/form/types";
import { uploadImages } from "@root/core/form/image-upload-utils";

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
      uploader: uploadImages,
    },
    {
      name: "active",
      label: "Kích hoạt",
      kind: "switch",
    },
  ];
}
