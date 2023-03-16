export const formatUnderlying = (network, underlying) => {
  let formattedUnderlying;
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

  return formattedUnderlying;
};
