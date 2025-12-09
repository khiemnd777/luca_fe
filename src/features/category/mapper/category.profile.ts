import { mapper } from "@root/core/mapper/auto-mapper";
import type { CategoryModel } from "@features/category/model/category.model";

mapper.register<CategoryModel>({
  name: "Category",
  dtoToModelNaming: "snake_to_camel",
  modelToDtoNaming: "camel_to_snake",
  defaultModel: () => ({
    id: 0,
    code: "",
    name: "",
    active: true,
    collectionId: null,
    customFields: null,
    productIds: null,
    createdAt: "",
    updatedAt: "",
  }),
});
