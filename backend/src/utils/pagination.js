const parsePagination = ({ page = 1, limit = 20, skip } = {}, maxLimit = 100) => {
  const numericLimit = Math.min(Math.max(Number(limit) || 20, 1), maxLimit);

  if (skip !== undefined) {
    const numericSkip = Math.max(Number(skip) || 0, 0);
    return {
      skip: numericSkip,
      limit: numericLimit,
      page: Math.floor(numericSkip / numericLimit) + 1,
    };
  }

  const numericPage = Math.max(Number(page) || 1, 1);
  return {
    page: numericPage,
    limit: numericLimit,
    skip: (numericPage - 1) * numericLimit,
  };
};

module.exports = {
  parsePagination,
};
