import { formatDateTime } from "./formatDateTime.js";

export const formatDateAndTimestamp = (unixTimestamp) => {
  const formattedDate = formatDateTime(unixTimestamp);
  const timeStamp = unixTimestamp.toString();

  return { formattedDate, timeStamp };
};
