import * as React from "react";
import { buildDepartmentSettingsSchema } from "@features/settings/schemas/department-settings.schema";
import { AutoForm } from "@core/form/auto-form";
import type { AutoFormRef } from "@core/form/form.types";
import { useAuth } from "@core/auth/use-auth";

const DepartmentForm = React.forwardRef<AutoFormRef>((_, ref) => {
  const { department, fetchDepartment } = useAuth();
  const schema = React.useMemo(() => buildDepartmentSettingsSchema(), []);

  return (
    <>
      <AutoForm ref={ref} schema={schema} initial={department} onSaved={async (_) => {
        await fetchDepartment();
      }} />
    </>
  );
});

export default DepartmentForm;
