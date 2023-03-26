export const getTimeToExpiryAnnualized = (board) => {
  const timeToExpiry = board.timeToExpiry;
  const timeToExpiryAnnualized = timeToExpiry / (60 * 60 * 24 * 365);
  return timeToExpiryAnnualized;
};
