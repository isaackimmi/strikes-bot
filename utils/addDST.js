import moment from "moment";
import { hasDST } from "./hasDST";

export const addDST = (checkExpiry, expiry) => {
  let epochExpiry = moment(expiry);
  let epochExpiryDST;

  if (hasDST(checkExpiry)) {
    epochExpiryDST = epochExpiry.clone().add(1, "h");
    epochExpiry = epochExpiryDST.unix();
  } else {
    epochExpiry = epochExpiry.unix();
  }

  return epochExpiry;
};
