import { BigNumber } from "@ethersproject/bignumber";

export const UNIT = BigNumber.from(10).pow(18);
export const CONTRACT_SIZE = BigNumber.from(1).mul(UNIT);
