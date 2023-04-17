export const createExpiryOptions = (expiries) => {
  return expiries.map((expiry) => {
    return {
      label: expiry.formattedDate,
      value: expiry.timeStamp,
    };
  });
};
