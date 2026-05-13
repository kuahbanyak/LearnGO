export function unwrapApiResponse<T>(response: { data?: T } | undefined): T | null {
  return response?.data ?? null
}

export function unwrapPaginatedResponse<T>(
  response: { data?: { data?: T[] } } | undefined
): T[] {
  return response?.data?.data ?? []
}

export function getPaginationMeta(response: { data?: { total?: number; page?: number; per_page?: number } } | undefined) {
  return {
    total: response?.data?.total ?? 0,
    page: response?.data?.page ?? 1,
    perPage: response?.data?.per_page ?? 10,
  }
}
