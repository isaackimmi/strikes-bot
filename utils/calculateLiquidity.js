import toBigNumber from "../utils/toBigNumber";

export const calculateLiquidity = (strike, isCall, isBuy, limitPrice) => {
  let result = 0;
  let minNumOptions = 1;
  let maxNumOptions = 10000;

  while (minNumOptions <= maxNumOptions) {
    let numOptions = Math.floor((minNumOptions + maxNumOptions) / 2);

    const quote = strike.quoteSync(isCall, isBuy, toBigNumber(numOptions), {
      iterations: 3,
    });

    if (quote.isDisabled) {
      maxNumOptions = numOptions - 1;
    } else {
      const pricePerOption = quote.pricePerOption / 1e18;

      if (pricePerOption <= limitPrice) {
        result = numOptions;
        minNumOptions = numOptions + 1;
      } else {
        maxNumOptions = numOptions - 1;
      }
    }
  }

  return result;
};
