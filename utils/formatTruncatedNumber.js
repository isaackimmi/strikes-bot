// From lyra-finance/interface

import { BigNumber } from "@ethersproject/bignumber";
import { formatNumber } from "./formatNumber";
import fromWei from "./fromWei";

const BILLION = 10 ** 9;
const MILLION = 10 ** 6;
const THOUSAND = 10 ** 3;

export const formatTruncatedNumber = (value) => {
  let val = 0;
  if (BigNumber.isBigNumber(value)) {
    val = fromWei(value);
  } else {
    val = value;
  }
  if (Math.abs(val) >= BILLION - 10 ** 7) {
    // billion
    return formatNumber(val / BILLION, { minDps: 0, maxDps: 2 }) + "b";
  } else if (Math.abs(val) >= MILLION - 10 ** 4) {
    // million
    return formatNumber(val / MILLION, { minDps: 0, maxDps: 2 }) + "m";
  } else if (Math.abs(val) >= THOUSAND - 10 ** 1) {
    // thousand
    return formatNumber(val / THOUSAND, { minDps: 0, maxDps: 2 }) + "k";
  } else {
    // hundreds
    return formatNumber(val, { minDps: 0, maxDps: 2 });
  }
};
