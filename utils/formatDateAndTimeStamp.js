import { formatDateTime } from "./formatDateTime.js";

export const formatDateAndTimestamp = (unixTimestamp, userTimezone) => {
  const formattedDate = formatDateTime(unixTimestamp, userTimezone);
  const timeStamp = unixTimestamp.toString();

  return { formattedDate, timeStamp };
};
