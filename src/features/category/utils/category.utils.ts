import { id as fetchCategoryById, search as searchCategory } from "../api/category.api";
import type { CategoryModel } from "../model/category.model";

const NBSP = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0";

export function categoryTree(d: CategoryModel, others: CategoryModel[]): string {
  const level = d.level ?? 1;

  // LEVEL 1
  if (level === 1) return d.name ?? "";

  const siblings = others
    .filter(x => x.parentId === d.parentId)
    .sort((a, b) => (a.id - b.id));

  const idx = siblings.findIndex(x => x.id === d.id);
  const isLast = idx === siblings.length - 1;

  const prefix = isLast ? "└─ " : "├─ ";

  // LEVEL 2 → NO INDENT
  if (level === 2) {
    return prefix + d.name;
  }

  // LEVEL >= 3 → indent = (level - 2)
  const indent = NBSP.repeat(level - 2);

  return indent + prefix + d.name;
}

export function categoryPath(item: CategoryModel): string {
  const parts: string[] = [];

  if (item.categoryNameLv1) parts.push(item.categoryNameLv1);
  if (item.categoryNameLv2) parts.push(item.categoryNameLv2);
  if (item.categoryNameLv3) parts.push(item.categoryNameLv3);

  if (item.name) parts.push(item.name);

  return parts.join(" > ");
}

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
