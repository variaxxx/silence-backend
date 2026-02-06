export const HTTP_METHOD = {
  POST: "POST",
  GET: "GET",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export type HttpMethod = typeof HTTP_METHOD[keyof typeof HTTP_METHOD];
