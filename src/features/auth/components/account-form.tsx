import type { AutoFormRef } from "@core/form/form.types";
import { useAuth } from "@root/core/auth/use-auth";
import { buildAccountSchema } from "../schemas/account.schema";
import React from "react";
import { AutoForm } from "@root/core/form/auto-form";

const AccountForm = React.forwardRef<AutoFormRef>((_, ref) => {
  const { user, fetchMe } = useAuth();
  const schema = React.useMemo(() => buildAccountSchema(), []);

  return (
    <>
      <AutoForm ref={ref} schema={schema} initial={user} onSaved={async (_) => {
        await fetchMe();
      }} />
    </>
  );
});

export default AccountForm;