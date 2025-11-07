import { mapper } from "@core/mapper/auto-mapper";

mapper.register({
  name: "FetchTableOpts",
  dtoToModelNaming: "snake_to_camel",  // mặc định: snake_case -> camelCase
  modelToDtoNaming: "camel_to_snake",  // ngược lại
});