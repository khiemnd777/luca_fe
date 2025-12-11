import { id as fetchCategoryById, search as searchCategory } from "../api/category.api";
import type { CategoryModel } from "../model/category.model";
import { categoryPath } from "./category.utils";

type CategoryValueHolder = Record<string, any>;

const getInputLabel = (d?: CategoryModel | null) => d?.name ?? "";

const getOptionLabel = (d?: CategoryModel | null) => (d ? categoryPath(d) : "");

const searchPage = async (kw: string, page: number, limit: number): Promise<CategoryModel[]> => {
  const result = await searchCategory({
    keyword: kw,
    limit,
    page,
    orderBy: "parent_id",
  });
  return result.items;
};

const hydrateById = async (idValue: number | string | null | undefined): Promise<CategoryModel | null> => {
  if (!idValue) return null;
  const category = await fetchCategoryById(Number(idValue));
  return category ?? null;
};

const fetchOne = async (values: CategoryValueHolder): Promise<CategoryModel | null> => {
  const key = values.parentId ?? values.categoryId;
  if (!key) return null;
  const category = await fetchCategoryById(Number(key));
  return category ?? null;
};

export const categoryProps = {
  getInputLabel,
  getOptionLabel,
  searchPage,
  hydrateById,
  fetchOne,
};
