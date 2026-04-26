export function getLastTenDaysRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 9);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export function buildDateQuery(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const query = params.toString();
  return query ? `?${query}` : "";
}
