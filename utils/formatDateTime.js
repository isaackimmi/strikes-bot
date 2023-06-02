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

  //  console.log(ts);
  //  console.log(moment.utc(parseDate(ts)));

  //  var aestTime = parseDate(ts).toLocaleString("en-US", {
  //    timeZone: "Australia/Brisbane",
  //  });

  //  console.log("AEST time: " + new Date(aestTime).toISOString());

  return moment.utc(new Date(parseDate(ts))).format(dateFormat);
};
