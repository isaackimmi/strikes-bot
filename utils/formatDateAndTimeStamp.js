import { fromUnixEpoch } from "./fromUnixEpoch.js";

export const formatDateAndTimestamp = (unixTimestamp) => {
  const formattedDate = fromUnixEpoch(unixTimestamp);
  const timeStamp = unixTimestamp.toString();

  return { formattedDate, timeStamp };
};
