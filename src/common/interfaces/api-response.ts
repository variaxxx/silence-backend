export interface ApiResponse<T = any> {
  statusCode: number;
  message?: string;
  data?: T;
}

export interface FindManyApiResponse<T = any> {
  total: number;
  items: T[];
}
