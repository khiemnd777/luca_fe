import type { FieldDef } from "@core/form/types";
import type { FormSchema, SubmitDef } from "@core/form/form.types";
import { uploadImages } from "@core/form/image-upload-utils";
import { mapper } from "@root/core/mapper/auto-mapper";

export function buildAccountSchema(): FormSchema {
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
        maxLength: 300
      },
    },
    {
      name: "phone",
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
    },
  ];

  const submit: SubmitDef = {
    type: "fn",
    run: async (values) => {
      console.log(values);
    }
  };

  return {
    fields,
    toasts: {
      saved: "Lưu tài khoản thành công!",
      failed: "Lưu thất bại, xin thử lại!",
    },
    submit,
    hooks: {
      mapToDto: (v) => mapper.map("Me", v, "model_to_dto"),
    }
  };
}
