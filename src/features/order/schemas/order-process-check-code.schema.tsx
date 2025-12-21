import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerForm } from "@core/form/form-registry";
import { navigate } from "@root/core/navigation/navigate";

export function buildOrderProcessCheckCodeSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "code",
      label: "Mã đơn hàng",
      kind: "text",
      rules: {
        required: "Vui lòng nhập mã đơn hàng",
      },
      fullWidth: true,
    },
  ];

  return {
    fields,
    submit: {
      type: "fn",
      run: async (values) => {
        const code = values.dto?.code;
        if (code) {
          navigate(`/order/check/${code}`);
        }
        return values;
      },
    },
  };
}

registerForm("order-process-check-code", buildOrderProcessCheckCodeSchema);
