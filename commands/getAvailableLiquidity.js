import { BigNumber } from "@ethersproject/bignumber";
import { getPrice } from "../utils/getPrice";
import { getOptionsNeeded } from "../utils/getOptionsNeeded";

export const getAvailableLiquidity = async (
  slippage,
  spotPrice,
  option,
  skew,
  baseIv
) => {
  const MAX_ITERATIONS = 100;
  const PRECISION = BigNumber.from(10).pow(18);
  //const optionPrice = await getPrice(isCall, spotPrice, strikePrice, expiry);
  const { price, volTraded } = getPrice(option, baseIv, skew);
  //console.log(price);
  //console.log(volTraded);

  const maxOptions = PRECISION.mul(slippage).div(price);
  const maxUnderlying = spotPrice.mul(maxOptions).div(PRECISION);

  let liquidity = maxUnderlying.div(BigNumber.from(2));
  const availableLiquidity = [];

  let iterations = 0;
  while (iterations < MAX_ITERATIONS) {
    const remainingOptions = await getOptionsNeeded(
      spotPrice,
      option,
      skew,
      baseIv
    );

    const remainingUnderlying = remainingOptions.mul(price).div(PRECISION);

    if (remainingOptions.eq(0) || remainingUnderlying.lt(maxUnderlying)) {
      availableLiquidity.push(liquidity);
    }

    if (remainingUnderlying.gt(maxUnderlying)) {
      liquidity = liquidity.add(maxUnderlying).div(2);
    }

    if (remainingUnderlying.lt(maxUnderlying)) {
      liquidity = liquidity.div(2);
    }

    iterations++;
  }

  if (availableLiquidity.length === 0) {
    throw new Error("No available liquidity found");
  }

  return availableLiquidity;
};
