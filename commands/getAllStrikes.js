import moment from "moment";
import { hasDST } from "../utils/hasDST";

export const getAllStrikes = async (lyra, underlying, expiry) => {
  let formattedUnderlying;
  const checkExpiry = new Date(expiry);
  let epochExpiry = moment(expiry);
  let epochExpiryDST;

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
  const filteredStrikes = board
    .strikes()
    .filter((strike) => strike.isDeltaInRange);

  // Map strikes to desired format
  const formattedStrikes = filteredStrikes.map((strike) => ({
    strikePrice: strike.strikePrice / 1e18,
    skew: (strike.skew / 1e18).toFixed(3),
    iv: ((strike.iv / 1e18) * 100).toFixed(2) + "%",
    vol: ((strike.skew / 1e18) * (strike.iv / 1e18) * 100).toFixed(2) + "%",
    vega: (strike.vega / 1e18).toFixed(3),
    gamma: (strike.gamma / 1e18).toFixed(3),
    isDeltaInRange: strike.isDeltaInRange,
    openInterest: strike.openInterest,
    call: strike.call(),
    put: strike.put(),
  }));

  //console.log(formattedStrikes[0].put);

  // Sort strikes based on strike price
  const sortedStrikes = formattedStrikes.sort(
    (a, b) => a.strikePrice - b.strikePrice
  );

  return sortedStrikes;
};
