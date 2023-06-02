import moment from "moment";
import parseDate from "./parseDate";

export const formatDateTime = (ts, options) => {
  const {
    hideYear = false,
    hideMins = true,
    includeTimezone = false,
  } = options ?? {};

  const dateFormat = {
    year: hideYear ? undefined : "numeric",
    month: "short",
    day: "numeric",
    hour: hideMins ? "numeric" : "numeric",
    minute: hideMins ? undefined : "numeric",
    hour12: true, // Display in 12-hour format
    hourCycle: "h23", // Suppress leading zero in hour
  };

  const parsedDate = parseDate(ts);
  const userLocalDateTime = parsedDate.toLocaleString(undefined, dateFormat);

  return userLocalDateTime;
};
