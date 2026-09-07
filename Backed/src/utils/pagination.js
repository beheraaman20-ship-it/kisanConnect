export function parsePagination(query, defaults = { page: 1, perPage: 20, maxPerPage: 100 }) {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page);
  const perPage = Math.min(
    parseInt(query.perPage, 10) || defaults.perPage,
    defaults.maxPerPage || 100,
  );
  return { page, perPage, offset: (page - 1) * perPage, limit: perPage };
}

export function paginateMeta(total, page, perPage) {
  return {
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}