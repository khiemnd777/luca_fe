import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { reloadTable } from "@core/table/table-reload";

import {
  createImportProfile,
  updateImportProfile,
  getImportProfile,
} from "@core/metadata/data/import.api";
import type { ImportFieldProfileModel } from "@core/metadata/data/import.model";
import { mapper } from "@root/core/mapper/auto-mapper";
import { registerForm } from "@root/core/form/form-registry";

export function buildMetadataImportProfileSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "scope",
      label: "Scope",
      kind: "text",
      helperText: 'Entity/module scope, e.g. "clinic", "dentist", "order"...',
      rules: {
        required: "Scope is required",
        maxLength: 100,
      },
    },
    {
      name: "code",
      label: "Code",
      kind: "text",
      helperText: "Internal code, lowercase, no spaces (e.g. default, vn-2025)",
      rules: {
        required: "Code is required",
        maxLength: 100,
      },
    },
    {
      name: "name",
      label: "Name",
      kind: "text",
      rules: {
        required: "Name is required",
        maxLength: 200,
      },
    },
    {
      name: "description",
      label: "Description",
      kind: "textarea",
      rows: 2,
    },
    {
      name: "isDefault",
      label: "Default profile",
      kind: "switch",
      helperText: "If checked, this profile is the default for this scope",
    },
  ];

  return {
    idField: "id",
    fields,
    submit: {
      create: {
        type: "fn",
        run: async (values: any) => {
          await createImportProfile(values);
          return values;
        },
      },
      update: {
        type: "fn",
        run: async (values: any) => {
          await updateImportProfile(values.id, values);
          return values;
        },
      },
    },

    async initialResolver(data: any) {
      if (data?.id) {
        const result = await getImportProfile(data.id);
        return result;
      }
      return {};
    },

    afterSaved() {
      reloadTable("import-profiles");
    },

    hooks: {
      mapToDto: (v) =>
        mapper.map<any, ImportFieldProfileModel>("Common", v, "model_to_dto"),
    },
  };
}

registerForm("import-profile", buildMetadataImportProfileSchema);

registerFormDialog(
  "import-profile",
  buildMetadataImportProfileSchema,
  {
    title: { create: "New import profile", update: "Edit import profile" },
    confirmText: { create: "Create", update: "Save" },
    cancelText: "Cancel",
  }
);
