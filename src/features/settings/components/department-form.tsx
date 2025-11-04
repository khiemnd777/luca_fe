import * as React from "react";
import { Stack } from "@mui/material";
import { buildDepartmentSettingsSchema } from "@features/settings/schemas/department-settings.schema";
import type { MyDepartmentDto } from "@core/network/my-department.dto";
import { useAutoForm } from "@core/form/use-auto-form";
import { AutoFormFields } from "@core/form/auto-form-fields";
import { mapper } from "@core/mapper/auto-mapper";

export type DepartmentFormRef = {
  submit: () => Promise<boolean>;
  reset: () => void;
};

type Props = {
  initial?: Partial<MyDepartmentDto | null>;
  onSaved?: () => void;
};

const DepartmentForm = React.forwardRef<DepartmentFormRef, Props>((props, ref) => {
  const schema = React.useMemo(() => buildDepartmentSettingsSchema(), []);
  const { values, setValue, errors, validateAll, reset } = useAutoForm(schema, props.initial ?? {});
  const [saving, setSaving] = React.useState(false);

  const handleSave = React.useCallback(async (): Promise<boolean> => {
    const ok = await validateAll();
    if (!ok) return false;

    setSaving(true);
    try {
      const payload = mapper.map<Record<string, any>, MyDepartmentDto>("MyDepartment", values, "model_to_dto");
      console.log(`[payload] ${payload}`);
      // await departmentApi.updateMyDepartment(payload);
      props.onSaved?.();
      // toast.success?.("Saved"); // toast later
      return true;
    } finally {
      setSaving(false);
    }
  }, [validateAll, values, props]);

  React.useImperativeHandle(ref, () => ({
    submit: handleSave,
    reset,
  }));

  return (
    <Stack spacing={2} data-saving={saving ? "true" : "false"}>
      <AutoFormFields schema={schema} values={values} setValue={setValue} errors={errors} />
    </Stack>
  );
});

export default DepartmentForm;
