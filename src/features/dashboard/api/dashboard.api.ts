import dayjs from "dayjs";
import { useAsync } from "@core/hooks/use-async";
import { mapper } from "@core/mapper/auto-mapper";
import { apiClient } from "@core/network/api-client";
import { useAuthStore } from "@store/auth-store";
import type {
  AvgRemakeRateResult,
  AvgRemakeRateResultDto,
  AvgTurnaroundResult,
  AvgTurnaroundResultDto,
  CasesMetricResult,
  CasesMetricResultDto,
  DashboardCompareParams,
  DashboardCompareParamsDto,
} from "../model/dashboard.model";

export type DashboardStat = {
  value: number | string;
  delta?: string;
  caption?: string;
};

function toQuery(params: DashboardCompareParams): DashboardCompareParamsDto {
  const dto = mapper.map<DashboardCompareParams, DashboardCompareParamsDto>(
    "Dashboard",
    params,
    "model_to_dto",
  );

  const query: DashboardCompareParamsDto = {
    from_date: dto.from_date,
    to_date: dto.to_date,
    previous_from_date: dto.previous_from_date,
    previous_to_date: dto.previous_to_date,
  };

  if (dto.department_id != null) {
    query.department_id = dto.department_id;
  }

  return query;
}

async function getDashboardMetric<TModel, TDto>(
  path: string,
  params: DashboardCompareParams,
): Promise<TModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<TDto>(`${departmentApiPath()}${path}`, {
    params: toQuery(params),
  });
  return mapper.map<TDto, TModel>("Dashboard", data, "dto_to_model");
}

export function fetchAvgTurnaround(
  params: DashboardCompareParams,
): Promise<AvgTurnaroundResult> {
  return getDashboardMetric<AvgTurnaroundResult, AvgTurnaroundResultDto>(
    "/dashboard/case-daily-stats/avg-turnaround",
    params,
  );
}

export function fetchAvgRemakeRate(
  params: DashboardCompareParams,
): Promise<AvgRemakeRateResult> {
  return getDashboardMetric<AvgRemakeRateResult, AvgRemakeRateResultDto>(
    "/dashboard/case-daily-remake-stats/avg-remake-rate",
    params,
  );
}

export function fetchCompletedCases(
  params: DashboardCompareParams,
): Promise<CasesMetricResult> {
  return getDashboardMetric<CasesMetricResult, CasesMetricResultDto>(
    "/dashboard/case-daily-completed-stats/completed-cases",
    params,
  );
}

export function fetchActiveCases(
  params: DashboardCompareParams,
): Promise<CasesMetricResult> {
  return getDashboardMetric<CasesMetricResult, CasesMetricResultDto>(
    "/dashboard/case-daily-active-stats/active-cases",
    params,
  );
}

function formatDelta(delta: number, suffix: string): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} ${suffix}`;
}

function buildTodayParams(): DashboardCompareParams {
  const todayStart = dayjs().startOf("day");
  const todayEnd = dayjs().endOf("day");
  const prevStart = todayStart.subtract(1, "day");
  const prevEnd = todayEnd.subtract(1, "day");

  return {
    fromDate: todayStart.toISOString(),
    toDate: todayEnd.toISOString(),
    previousFromDate: prevStart.toISOString(),
    previousToDate: prevEnd.toISOString(),
  };
}

function buildWeekParams(): DashboardCompareParams {
  const weekStart = dayjs().startOf("week");
  const weekEnd = dayjs().endOf("week");
  const prevStart = weekStart.subtract(1, "week");
  const prevEnd = weekEnd.subtract(1, "week");

  return {
    fromDate: weekStart.toISOString(),
    toDate: weekEnd.toISOString(),
    previousFromDate: prevStart.toISOString(),
    previousToDate: prevEnd.toISOString(),
  };
}

export function useActiveCasesToday() {
  return useAsync<DashboardStat>(
    async () => {
      const res = await fetchActiveCases(buildTodayParams());
      return {
        value: res.value,
        delta: formatDelta(res.delta, "hôm nay"),
      };
    },
    [],
    { key: "dashboard:active-cases-today" },
  );
}

export function useCasesCompletedThisWeek() {
  return useAsync<DashboardStat>(
    async () => {
      const res = await fetchCompletedCases(buildWeekParams());
      return {
        value: res.value,
        delta: formatDelta(res.delta, "tuần này"),
      };
    },
    [],
    { key: "dashboard:cases-completed-week" },
  );
}

export function useAvgTurnaround() {
  return useAsync<DashboardStat>(
    async () => {
      const res = await fetchAvgTurnaround(buildWeekParams());
      const avgDays = Number.isFinite(res.avgDays) ? res.avgDays : 0;
      const deltaDays = Number.isFinite(res.deltaDays) ? res.deltaDays : 0;
      const sign = deltaDays > 0 ? "+" : "";

      return {
        value: `${avgDays.toFixed(1)} ngày`,
        delta: `${sign}${deltaDays.toFixed(1)}`,
        caption: "so với kỳ trước", //"vs previous period",
      };
    },
    [],
    { key: "dashboard:avg-turnaround" },
  );
}

export function useAvgRemakeRate() {
  return useAsync<DashboardStat>(
    async () => {
      const res = await fetchAvgRemakeRate(buildWeekParams());
      const rate = Number.isFinite(res.rate) ? res.rate : 0;
      const deltaRate = Number.isFinite(res.deltaRate) ? res.deltaRate : 0;
      const sign = deltaRate > 0 ? "+" : "";

      return {
        value: `${(rate * 100).toFixed(1)}%`,
        delta: `${sign}${(deltaRate * 100).toFixed(1)}%`,
        caption: "làm lại",
      };
    },
    [],
    { key: "dashboard:avg-remake-rate" },
  );
}
