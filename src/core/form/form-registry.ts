import type { FormSchema } from "@core/form/form.types";

type SchemaBuilder = () => FormSchema;

const registry = new Map<string, SchemaBuilder>();

export function registerForm(name: string, build: SchemaBuilder) {
  registry.set(name, build);
}

export function getFormSchema(name: string): FormSchema | null {
  const build = registry.get(name);
  return build ? build() : null;
}
