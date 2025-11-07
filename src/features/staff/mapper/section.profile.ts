import type { SectionModel } from "@features/staff/model/section.model";
import { mapper } from "@core/mapper/auto-mapper";

mapper.register<SectionModel>({
  name: "Section",
  dtoToModelNaming: "snake_to_camel",
  modelToDtoNaming: "camel_to_snake",
  defaultModel() {
    return { id: 0, name: "", code: "", description: "", active: true };
  },
});
