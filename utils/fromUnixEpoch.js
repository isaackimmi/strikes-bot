export const fromUnixEpoch = (timestamp) => {
  const date = new Date(timestamp * 1000);

  const options = {
    timeZone: "Australia/Sydney",
    hour12: true,
    hour: "numeric",
    minute: "numeric",
    day: "numeric",
    month: "short",
  };

  let formattedDate = new Intl.DateTimeFormat("en-US", options).format(date);

  // The formatted date might look like "Apr 15, 2:45 PM"
  // Extract month, day, hour, minute and am/pm parts using regex
  let match = formattedDate.match(/(\w+)\s(\d+),\s(\d+):(\d+)\s(\w+)/);

  if (!match) {
    // Couldn't match the expected format, return original date string
    return date.toString();
  }

  let [_, month, day, hour, minute, ampm] = match;

  // Make sure day and month don't have leading zeros
  day = day.startsWith("0") ? day.slice(1) : day;

  return `${month} ${day}, ${hour}:${minute}${ampm.toUpperCase()}`;
};
