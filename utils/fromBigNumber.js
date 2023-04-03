// From lyra-finance/interface

import { formatUnits } from "@ethersproject/units";

export default function fromBigNumber(number, decimals = 18) {
  return parseFloat(formatUnits(number.toString(), decimals));
}
