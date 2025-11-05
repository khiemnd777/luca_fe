import type { FieldDef } from "@core/form/types";
import type { FormSchema, SubmitDef } from "@core/form/form.types";
import { mapper } from "@root/core/mapper/auto-mapper";

export function buildAccountChangePasswordSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "password",
      kind: "change-password",
      label: "Đổi mật khẩu",
      currentLabel: "Mật khẩu hiện tại",
      newLabel: "Mật khẩu mới",
      confirmLabel: "Xác nhận mật khẩu mới",
      rules: {
        required: true,
      },
      passwordRules: {
        disallowReuseCurrent: false,
        minLength: 8,
        requireDigit: true,
      },
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
      saved: "Thay đổi mật khẩu thành công!",
      failed: "Thay đổi mật khẩu thất bại, xin thử lại!",
    },
    submit,
    hooks: {
      mapToDto: (v) => mapper.map("Me", v, "model_to_dto"),
    }
  };
}
