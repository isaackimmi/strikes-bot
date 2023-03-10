//import Lyra from "@lyrafinance/lyra-js";
import moment from "moment";

//const lyra = new Lyra();

export const getAllStrikes = async (lyra, underlying, expiry) => {
  switch (underlying) {
    case "ETH":
      underlying = "sETH-sUSD";
      break;
    case "BTC":
      underlying = "sBTC-sUSD";
      break;
    case "SOL":
      underlying = "sSOL-sUSD";
      break;
    default:
      break;
  }

  expiry = moment(expiry).unix();

  const markets = await lyra.markets();

  const market = markets.find(
    (market) => market.name.toLowerCase() === underlying.toLowerCase()
  );

  if (!market) {
    return "Invalid underlying";
  }

  const board = market
    .liveBoards()
    .find((board) => board.expiryTimestamp === expiry);

  if (!board) {
    return "Invalid expiry";
  }

  console.log(board);

  console.log(board);
  const strikes = board.strikes().map((strike) => ({
    id: strike.id,
    strikePrice: strike.strikePrice,
    skew: strike.skew,
    iv: strike.iv,
    vol: ((strike.skew / strike.iv) * 100).toFixed(2) + "%",
    vega: strike.vega,
    gamma: strike.gamma,
    isDeltaInRange: strike.isDeltaInRange,
    openInterest: strike.openInterest,
  }));

  console.log(strikes);
  return strikes;
};
