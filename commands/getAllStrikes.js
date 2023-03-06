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
    case "ETH":
      underlying = "sSOL-sUSD";
      break;
    default:
      break;
  }
  //  console.log(lyra.markets());
  //  console.log(underlying);
  //  console.log(moment(expiry).unix());

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
    //callLiquidity: strike.call.liquidity(),
    //putLiquidity: strike.put.liquidity(),
  }));

  console.log(strikes);
  return strikes;
};
