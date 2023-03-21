// From lyra-finance/interface
import { formatEther } from "@ethersproject/units";

export default function fromWei(number) {
  return parseFloat(formatEther(number.toString()));
}
