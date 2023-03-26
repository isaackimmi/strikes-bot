import { BigNumber } from "@ethersproject/bignumber";
import { getPrice } from "./getPrice";

export const getOptionsNeeded = async (spotPrice, option, baseIv, skew) => {
  const PRECISION = BigNumber.from(10).pow(18);
  const MAX_SAFE_INTEGER = BigNumber.from(Number.MAX_SAFE_INTEGER.toString());

  // Calculate the theoretical option price
  const { price } = getPrice(option, spotPrice, baseIv, skew);

  // Calculate the number of options needed
  const optionsNeeded = MAX_SAFE_INTEGER.mul(PRECISION).div(price);

  return optionsNeeded;
};
