import { mapper } from "@core/mapper/auto-mapper";

mapper.register({
  name: "Role",
  dtoToModelNaming: "snake_to_camel",
  modelToDtoNaming: "camel_to_snake",
});
