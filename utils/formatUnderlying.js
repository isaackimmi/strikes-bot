export const formatUnderlying = (network, underlying) => {
  let formattedUnderlying;
  if (network.toUpperCase() === "OP") {
    switch (underlying) {
      case "OP":
        formattedUnderlying = "OP-USDC";
        break;
      case "ARB":
        formattedUnderlying = "ARB-USDC";
        break;
      case "ETH":
        formattedUnderlying = "ETH-USDC";
        break;
      case "BTC":
        formattedUnderlying = "WBTC-USDC";
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
