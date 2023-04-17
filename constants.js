import { BigNumber } from "@ethersproject/bignumber";

export const UNIT = BigNumber.from(10).pow(18);
export const CONTRACT_SIZE = BigNumber.from(1).mul(UNIT);

export const CHAIN_OPTIONS = [
  { label: "Optimism", value: "OP" },
  { label: "Arbitrum", value: "ARB" },
];

export const MARKET_OPTIONS = [
  {
    label: "ETH",
    value: "ETH",
  },
  {
    label: "BTC",
    value: "BTC",
  },
];

export const SLIPPAGE_OPTIONS = [
  {
    label: "1%",
    value: "0.01",
  },
  {
    label: "2%",
    value: "0.02",
  },
  {
    label: "5%",
    value: "0.05",
  },
  {
    label: "10%",
    value: "0.1",
  },
];

export const ISBUY_OPTIONS = [
  {
    label: "Buy",
    value: "true",
  },
  {
    label: "Sell",
    value: "false",
  },
];

export const ISCALL_OPTIONS = [
  {
    label: "Call",
    value: "true",
  },
  {
    label: "Put",
    value: "false",
  },
];
