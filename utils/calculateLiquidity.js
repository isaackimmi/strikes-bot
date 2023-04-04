import toBigNumber from "../utils/toBigNumber";
import { QuoteDisabledReason } from "@lyrafinance/lyra-js";

export const calculateLiquidity = async (strike, isCall, isBuy, limitPrice) => {
  let result = 0;
  let minNumOptions = 1;
  let maxNumOptions = 10000;

  while (minNumOptions <= maxNumOptions) {
    let numOptions = Math.floor((minNumOptions + maxNumOptions) / 2);
    const quote = await strike.quote(isCall, isBuy, toBigNumber(numOptions), {
      iterations: 3,
    });

    if (quote.disabledReason === QuoteDisabledReason.InsufficientLiquidity) {
      maxNumOptions = numOptions - 1;
    } else if (quote.isDisabled) {
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

    console.log(
      `${
        strike.strikePrice / 1e18
      }: ${numOptions}, ${minNumOptions}, ${maxNumOptions} ${
        quote.isDisabled
      }, ${quote.disabledReason}`
    );
  }

  return result;
};
