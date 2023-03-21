// From lyra-finance/interface

import { BigNumber } from "@ethersproject/bignumber";
import fromWei from "./fromWei";

const DEFAULT_PRECISION = 0.001;

const round = (val, dps) => {
  const mul = 10 ** dps;
  return Math.round(val * mul) / mul;
};

export const formatNumber = (value, options = {}) => {
  const {
    dps,
    minDps = 0,
    maxDps = 6,
    precision = DEFAULT_PRECISION,
    showSign = false,
    showCommas = true,
  } = options;

  const min = dps !== undefined ? dps : minDps;
  const max = dps !== undefined ? dps : maxDps;

  let val = 0;
  if (BigNumber.isBigNumber(value)) {
    val = fromWei(value);
  } else {
    val = value;
  }

  if (isNaN(val)) {
    return "NaN";
  }

  let numDps = min;
  let currRoundedVal = round(val, numDps);
  for (; numDps <= max; numDps++) {
    currRoundedVal = round(val, numDps);
    const currPrecision = Math.abs((val - currRoundedVal) / val);
    if (currPrecision <= precision) {
      break;
    }
  }

  const roundedVal = currRoundedVal;
  const parts = roundedVal.toString().split(".");
  const num = showCommas
    ? parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : parts[0];
  const dec = (parts[1] || "").padEnd(min, "0");
  const numStr = dec != null && dec.length > 0 ? num + "." + dec : num;

  return roundedVal > 0 && showSign ? "+" + numStr : numStr;
};
