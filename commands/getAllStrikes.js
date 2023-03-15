import moment from "moment";
import { BigNumber } from "@ethersproject/bignumber";

import { hasDST } from "../utils/hasDST";

export const getAllStrikes = async (
  lyra,
  underlying,
  expiry,
  network,
  isBuy,
  isCall
) => {
  let formattedUnderlying;
  const checkExpiry = new Date(expiry);
  let epochExpiry = moment(expiry);
  let epochExpiryDST;

  if (network.toUpperCase() === "OP") {
    switch (underlying) {
      case "ETH":
        formattedUnderlying = "sETH-sUSD";
        break;
      case "BTC":
        formattedUnderlying = "sBTC-sUSD";
        break;
      case "SOL":
        formattedUnderlying = "sSOL-sUSD";
        break;
      default:
        break;
    }
  } else if (network.toUpperCase() === "ARB") {
    switch (underlying) {
      case "ETH":
        formattedUnderlying = "ETH-USDC";
        break;
      case "BTC":
        formattedUnderlying = "WBTC-USDC";
        break;
      default:
        break;
    }
  }

  if (hasDST(checkExpiry)) {
    epochExpiryDST = epochExpiry.clone().add(1, "h");
    epochExpiry = epochExpiryDST.unix();
  } else {
    epochExpiry = epochExpiry.unix();
  }

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

  let filteredOptions;

  //console.log(filteredStrikes[0].call());

  filteredOptions = filteredStrikes
    .map((strike) => {
      return strike.call();
    })
    .filter((option) => {
      return option.isCall === true;
    });

  // Map strikes to desired format
  const formattedStrikes = await Promise.all(
    filteredOptions.map(async (option) => {
      const size = BigNumber.from("12345678901234567890");

      // USE quoteAllSync INSTEAD OF QUOTE.
      //const quote = await option.quote(isBuy, size);

      const quote = await option.quoteAllSync(size);

      // extract the data u need out of quote.
      return {
        strikePrice: (option.strike().strikePrice / 1e18).toFixed(0),
        skew: (option.strike().skew / 1e18).toFixed(3),
        iv: (option.strike().iv / 1e18) * 100 + "%",
        vol:
          (
            (option.strike().skew / 1e18) *
            (option.strike().iv / 1e18) *
            100
          ).toFixed(2) + "%",
        vega: (option.strike().vega / 1e18).toFixed(3),
        gamma: (option.strike().gamma / 1e18).toFixed(3),
        isDeltaInRange: option.isDeltaInRange,
        openInterest: option.strike().openInterest / 1e18,
        delta: (option.delta / 1e18).toFixed(3),
        theta: (option.theta / 1e18).toFixed(3),
        rho: (option.rho / 1e18).toFixed(3),
        breakEven: (quote.breakEven / 1e18).toFixed(2),
        toBreakEven: (quote.toBreakEven / 1e18).toFixed(2),
      };
    })
  );

  // Sort strikes based on strike price
  const sortedStrikes = formattedStrikes.sort(
    (a, b) => a.strikePrice - b.strikePrice
  );

  return sortedStrikes;
};
