export const hasDST = (date = new Date()) => {
  const january = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const july = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();

  return Math.max(january, july) !== date.getTimezoneOffset();
};
