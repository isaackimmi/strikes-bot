import moment from "moment-timezone";
import parseDate from "./parseDate";

export const formatDateTime = (ts, options) => {
  const {
    hideYear = false,
    hideMins = true,
    includeTimezone = false,
  } = options ?? {};

  const dateFormat = `MMM D, ${!hideYear ? "YYYY, " : ""}h${
    hideMins ? "" : ":mm"
  }A${includeTimezone ? " Z" : ""}`;

  return moment(parseDate(ts)).tz("Australia/Sydney").format(dateFormat);
};
