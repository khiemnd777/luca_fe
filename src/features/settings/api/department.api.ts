import type { DepartmentDto } from "@features/settings/model/department.dto";
import { apiClient } from "@core/network/api-client";
import { env } from "@core/config/env";
import { mapper } from "@core/mapper/auto-mapper";
import type { MyDepartmentDto } from "@root/core/network/my-department.dto";
import { useAuth } from "@root/core/auth/use-auth";

export async function fetchDepartmentBySlug(slug: string): Promise<DepartmentDto> {
  const { data } = await apiClient.get<any[]>(`${env.apiBasePath}/main/department/slug/${slug}`);
  const result = mapper.map<any, DepartmentDto>("Department", data, "dto_to_model");
  return result;
}

export async function updateDepartment(payload: Partial<MyDepartmentDto>): Promise<DepartmentDto> {
  const { departmentApiPath } = useAuth();
  const { data } = await apiClient.put<any>(departmentApiPath(), payload);
  const result = mapper.map<any, DepartmentDto>("Department", data, "dto_to_model");
  return result;
}