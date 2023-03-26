import { UNIT } from "../constants";
import { getBlackScholesPrice } from "./blackScholes";
import fromBigNumber from "./fromBigNumber";
import { getTimeToExpiryAnnualized } from "./getTimeToExpiryAnnualized";
import toBigNumber from "./toBigNumber";

export const getPrice = (option, newBaseIv, newSkew) => {
  const timeToExpiryAnnualized = getTimeToExpiryAnnualized(option.board());
  const rate = option.market().params.rateAndCarry;

  const newVol = newBaseIv.mul(newSkew).div(UNIT);

  const spotPrice = option.market().spotPrice;
  const strikePrice = option.strike().strikePrice;
  const price = toBigNumber(
    getBlackScholesPrice(
      timeToExpiryAnnualized,
      fromBigNumber(newVol),
      fromBigNumber(spotPrice),
      fromBigNumber(strikePrice),
      fromBigNumber(rate),
      option.isCall
    )
  );
  return {
    price,
    volTraded: newVol,
  };
};
