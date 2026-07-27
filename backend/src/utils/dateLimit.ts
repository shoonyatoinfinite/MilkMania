const getLocalDateStr = (dVal: string | Date = new Date()) => {
  const d = new Date(dVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isFutureDate = (dateVal: string | Date) => {
  if (!dateVal) return false;
  return getLocalDateStr(dateVal) > getLocalDateStr(new Date());
};
