import { apiClient } from "@core/network/api-client";
import type {
  CollectionModel,
  CollectionWithFieldsModel,
  FieldDto,
  FieldModel,
} from "./metadata.model";
import { env } from "@core/config/env";
import { mapper } from "@root/core/mapper/auto-mapper";

export type ListCollectionsParams = {
  query?: string;
  limit?: number;
  offset?: number;
  withFields?: boolean;
};

export async function listCollections(
  params: ListCollectionsParams = {}
): Promise<{ data: CollectionWithFieldsModel[]; total: number }> {
  const { query = "", limit = 20, offset = 0, withFields = true } = params;
  const res = await apiClient.get<{
    data: CollectionWithFieldsModel[];
    total: number;
  }>(`${env.apiBasePath}/metadata/collections`, {
    params: {
      query,
      limit,
      offset,
      with_fields: withFields,
    },
  });
  return res.data;
}

export async function getCollection(
  idOrSlug: string | number,
  withFields = true
): Promise<CollectionWithFieldsModel> {
  const res = await apiClient.get<CollectionWithFieldsModel>(
    `${env.apiBasePath}/metadata/collections/${idOrSlug}`,
    {
      params: { withFields },
    }
  );
  return res.data;
}

export type CreateCollectionInput = {
  slug: string;
  name: string;
};

export async function createCollection(
  input: CreateCollectionInput
): Promise<CollectionModel> {
  const res = await apiClient.post<CollectionModel>(`${env.apiBasePath}/metadata/collections`, input);
  return res.data;
}

export type UpdateCollectionInput = Partial<CreateCollectionInput>;

export async function updateCollection(
  id: number,
  input: UpdateCollectionInput
): Promise<CollectionModel> {
  const res = await apiClient.put<CollectionModel>(
    `${env.apiBasePath}/metadata/collections/${id}`,
    input
  );
  return res.data;
}

export async function deleteCollection(id: number): Promise<void> {
  await apiClient.delete(`${env.apiBasePath}/metadata/collections/${id}`);
}

// -------- Fields --------

export async function listFieldsByCollection(
  collectionId: number
): Promise<FieldModel[]> {
  const { data } = await apiClient.get<{ data: FieldDto[] }>(`${env.apiBasePath}/metadata/fields`, {
    params: { collection_id: collectionId },
  });
  const result = mapper.map<FieldDto[], FieldModel[]>("Common", data.data, "dto_to_model")
  return result;
}

export async function createField(input: FieldDto): Promise<FieldModel> {
  const { data } = await apiClient.post<FieldDto>(`${env.apiBasePath}/metadata/fields`, input);
  const result = mapper.map<FieldDto, FieldModel>("Common", data, "dto_to_model")
  return result;
}

export async function updateField(
  id: number,
  input: FieldDto
): Promise<FieldModel> {
  const { data } = await apiClient.put<FieldDto>(`${env.apiBasePath}/metadata/fields/${id}`, input);
  const result = mapper.map<FieldDto, FieldModel>("Common", data, "dto_to_model")
  return result;
}

export async function deleteField(id: number): Promise<void> {
  await apiClient.delete(`${env.apiBasePath}/metadata/fields/${id}`);
}
