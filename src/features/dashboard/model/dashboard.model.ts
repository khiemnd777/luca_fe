export interface DashboardCompareParams {
  departmentId?: number | null;
  fromDate: string;
  toDate: string;
  previousFromDate: string;
  previousToDate: string;
}

export interface DashboardCompareParamsDto {
  department_id?: number | null;
  from_date: string;
  to_date: string;
  previous_from_date: string;
  previous_to_date: string;
}

export interface AvgTurnaroundResult {
  avgDays: number;
  deltaDays: number;
}

export interface AvgTurnaroundResultDto {
  avg_days?: number;
  delta_days?: number;
}

export interface AvgRemakeRateResult {
  rate: number;
  deltaRate: number;
}

export interface AvgRemakeRateResultDto {
  rate?: number;
  delta_rate?: number;
}

export interface CasesMetricResult {
  value: number;
  delta: number;
}

export interface CasesMetricResultDto {
  value?: number;
  delta?: number;
}
