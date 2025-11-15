export type CollectionModel = {
  id: number;
  slug: string;
  name: string;
};

export type FieldVisibility = "public" | "hidden" | "readonly";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multiselect"
  | "relation";

export const FIELD_TYPES: FieldType[] = [
  "text",
  "textarea",
  "number",
  "date",
  "datetime",
  "boolean",
  "select",
  "multiselect",
  "relation",
];

export type FieldModel = {
  id: number;
  collectionId: number;
  name: string;
  label: string;
  type: FieldType | string;
  required: boolean;
  unique: boolean;
  table: boolean;
  form: boolean;
  defaultValue?: string | null;
  options?: string | null;
  orderIndex: number;
  visibility: FieldVisibility | string;
  relation?: string | null;
};

export type CollectionWithFieldsModel = CollectionModel & {
  fields?: FieldModel[];
  fieldsCount: number;
};

export type FieldDto = {
  collection_id: number;
  name: string;
  label: string;
  type: string;
  required: boolean;
  unique: boolean;
  table: boolean;
  form: boolean;
  default_value?: any;
  options?: any;
  order_index: number;
  visibility?: string;
  relation?: any;
};
