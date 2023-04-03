import { formatUnderlying } from "../utils/formatUnderlying";
import { CONTRACT_SIZE, UNIT } from "../constants";
import { addDST } from "../utils/addDST";
import { calculateLiquidity } from "./calculateLiquidity";

export const getAllStrikes = async (
  lyra,
  underlying,
  expiry,
  network,
  isBuy,
  isCall,
  slippage
) => {
  const formattedUnderlying = formatUnderlying(network, underlying);

  const epochExpiry = addDST(new Date(expiry), expiry);

  const markets = await lyra.markets();

  const market = markets.find(
    (market) => market.name.toLowerCase() === formattedUnderlying.toLowerCase()
  );

  if (!market) {
    return "Invalid underlying";
  }

  const board = market
    .liveBoards()
    .find((board) => board.expiryTimestamp === epochExpiry);

  if (!board) {
    return "Invalid expiry";
  }

  // Filter out strikes where isDeltaInRange is false
  let filteredStrikes = board
    .strikes()
    .filter((strike) => strike.isDeltaInRange);

  const formattedStrikes = await Promise.all(
    filteredStrikes.map(async (strike) => {
      const quote = await strike.quote(isCall, isBuy, CONTRACT_SIZE, {
        iterations: 3,
      });

      const option = strike.option(isCall);

      //console.log(`${foo}: ${freeLiquidity / 1e18}`);
      //console.log("-------------");
      //console.log(`${foo}: ${burnableLiquidity / 1e18}`);

      //const bigNumberSlippage = parseUnits(slippage, 18);

      //const bigNumberValue = BigNumber.from("0.01");
      //console.log(bigNumberSlippage); // BigNumber { _hex: '0x9', _isBigNumber: true }

      //const availableLiquidity = await getAvailableLiquidity(
      //  strike.market().spotPrice,
      //  option,
      //  strike.skew,
      //  baseIv,
      //  bigNumberSlippage,
      //  freeLiquidity
      //);

      const LIMIT_PRICE =
        (quote.pricePerOption / 1e18) * (1 + parseFloat(slippage));

      //console.log(1 + parseFloat(slippage));

      const liquidity = await calculateLiquidity(
        strike,
        isCall,
        isBuy,
        LIMIT_PRICE
      );

      //const foo = await strike.quote(isCall, isBuy, toBigNumber(300), {
      //  iterations: 3,
      //});

      //console.log(
      //  `${strike.strikePrice / 1e18}: ${foo.isDisabled}, ${
      //    foo.disabledReason
      //  }, ${foo.pricePerOption / 1e18}`
      //);

      console.log(`liquidity for ${strike.strikePrice / 1e18}: ${liquidity}`);

      //console.log(`${strike.market().name}: ${strike.market().spotPrice}`);

      // extract the data u need out of quote.

      // OPEN INTERESET IS CALCULATED LIKE THIS:
      // const openInterest = option.longOpenInterest.add(option.shortOpenInterest).mul(option.market().spotPrice).div(UNIT)

      return {
        strikePrice: (strike.strikePrice / 1e18).toFixed(0),
        breakEven: (quote.breakEven / 1e18).toFixed(2),
        toBreakEven: (quote.toBreakEven / 1e18).toFixed(2),
        pricePerOption: (quote.pricePerOption / 1e18).toFixed(2),
        openInterest: option.longOpenInterest
          .add(option.shortOpenInterest)
          .mul(option.market().spotPrice)
          .div(UNIT),
        skew: (strike.skew / 1e18).toFixed(3),
        baseIv:
          ((quote.fairIv / 1e18 / (strike.skew / 1e18)) * 100).toFixed(2) + "%",
        vol: ((quote.iv / 1e18) * 100).toFixed(1) + "%",
        vega: (quote.greeks.vega / 1e18).toFixed(3),
        gamma: (quote.greeks.gamma / 1e18).toFixed(3),
        delta: (quote.greeks.delta / 1e18).toFixed(3),
        theta: (quote.greeks.theta / 1e18).toFixed(3),
        rho: (quote.greeks.rho / 1e18).toFixed(3),
        availableLiquidity: liquidity,
      };
    })
  );

  // Sort strikes based on strike price
  const sortedStrikes = formattedStrikes.sort(
    (a, b) => a.strikePrice - b.strikePrice
  );

  return sortedStrikes;
};
