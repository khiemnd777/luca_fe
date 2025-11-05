import React from "react";
import type { AutoFormRef } from "@core/form/form.types";
import { AutoForm } from "@root/core/form/auto-form";
import { buildAccountChangePasswordSchema } from "../schemas/account-change-password.schema";

const AccountChangePasswordForm = React.forwardRef<AutoFormRef>((_, ref) => {
  const schema = React.useMemo(() => buildAccountChangePasswordSchema(), []);

  return (
    <>
      <AutoForm ref={ref} schema={schema} />
    </>
  );
});

export default AccountChangePasswordForm;