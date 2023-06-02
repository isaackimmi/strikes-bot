import { UNIT } from "../constants";
import { calculateLiquidity } from "../utils/calculateLiquidity";

export const getAllStrikes = async (
  filteredStrikes,
  isBuy,
  isCall,
  slippage
) => {
  const formattedStrikes = filteredStrikes.map((strike) => {
    const LIMIT_PRICE = (strike.pricePerOption / 1e18) * (1 + slippage);

    const liquidity = calculateLiquidity(
      strike.strike,
      isCall,
      isBuy,
      LIMIT_PRICE
    );

    return {
      strikePrice: (strike.strike.strikePrice / 1e18).toFixed(2),
      breakEven: (strike.breakEven / 1e18).toFixed(2),
      toBreakEven: (strike.toBreakEven / 1e18).toFixed(2),
      pricePerOption: (strike.pricePerOption / 1e18).toFixed(2),
      openInterest: strike.longOpenInterest
        .add(strike.shortOpenInterest)
        .mul(strike.spotPrice)
        .div(UNIT),
      skew: (strike.strike.skew / 1e18).toFixed(3),
      baseIv:
        ((strike.fairIv / 1e18 / (strike.strike.skew / 1e18)) * 100).toFixed(
          2
        ) + "%",
      vol: ((strike.iv / 1e18) * 100).toFixed(1) + "%",
      vega: (strike.greeks.vega / 1e18).toFixed(3),
      gamma: (strike.greeks.gamma / 1e18).toFixed(3),
      delta: (strike.greeks.delta / 1e18).toFixed(3),
      theta: (strike.greeks.theta / 1e18).toFixed(3),
      rho: (strike.greeks.rho / 1e18).toFixed(3),
      availableLiquidity: liquidity,
    };
  });

  // Sort strikes based on strike price
  const sortedStrikes = formattedStrikes.sort(
    (a, b) => a.strikePrice - b.strikePrice
  );

  return sortedStrikes;
};
