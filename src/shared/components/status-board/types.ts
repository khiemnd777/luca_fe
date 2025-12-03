export interface StatusOption {
  label: string;
  value: string;
}

export interface BoardItem<T = any> {
  id: number;
  status: string;
  priority?: string;
  obj: T;
}