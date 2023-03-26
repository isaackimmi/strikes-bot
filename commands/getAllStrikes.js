import moment from "moment";
import { formatUnderlying } from "../utils/formatUnderlying";
import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { CONTRACT_SIZE, UNIT } from "../constants";
import { addDST } from "../utils/addDST";
import toBigNumber from "../utils/toBigNumber";
import { getAvailableLiquidity } from "./getAvailableLiquidity";

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

      // Is this correct???
      const baseIv = strike.board().baseIv;
      const option = strike.option(isCall);

      //console.log(bigNumberSlippage);

      const bigNumberSlippage = parseUnits(slippage, 18);

      //const bigNumberValue = BigNumber.from("0.01");
      //console.log(bigNumberSlippage); // BigNumber { _hex: '0x9', _isBigNumber: true }

      const availableLiquidity = await getAvailableLiquidity(
        bigNumberSlippage,
        strike.market().spotPrice,
        option,
        strike.skew,
        baseIv
      );

      console.log(availableLiquidity);

      //console.log(availableLiquidity);

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
        availableLiquidity: (availableLiquidity / 1e18).toFixed(3),
      };
    })
  );

  // Sort strikes based on strike price
  const sortedStrikes = formattedStrikes.sort(
    (a, b) => a.strikePrice - b.strikePrice
  );

  return sortedStrikes;
};
