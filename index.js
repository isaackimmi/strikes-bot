import Discord, {
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
} from "discord.js";
import Lyra, { Chain, Version, Network } from "@lyrafinance/lyra-js";
import {
  JsonRpcProvider,
  StaticJsonRpcProvider,
} from "@ethersproject/providers";

import dotenv from "dotenv";
import { getAllStrikes } from "./commands/getAllStrikes.js";
import { createExpiryOptions } from "./utils/createExpiryOptions.js";
import { formatTruncatedUSD } from "./utils/formatTruncatedUSD.js";
import { formatUnderlying } from "./utils/formatUnderlying.js";
import { formatDateAndTimestamp } from "./utils/formatDateAndTimeStamp.js";
import {
  ARB_MARKET_OPTIONS,
  CHAIN_OPTIONS,
  CONTRACT_SIZE,
  ISBUY_OPTIONS,
  ISCALL_OPTIONS,
  MARKET_OPTIONS,
  OP_MARKET_OPTIONS,
  SLIPPAGE_OPTIONS,
} from "./constants.js";
import { createStringSelectMenu } from "./utils/createStringSelectMenu.js";
import { formatDateTime } from "./utils/formatDateTime.js";

const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

let OP_LYRA;
let ARB_LYRA;
let selectedChain;
let selectedMarket;
let formattedUnderlying;
let expiries = [];
let selectedExpiry;
let selectedSlippage;
let isBuy;
let isCall;
let OP_MARKETS;
let ARB_MARKETS;
let expiryOptions;
let market;
let board;
let filteredStrikes = [];
let prevMessageId;
let userTimezone;

const getLyraSubgraphURI = (network, version) => {
  const SATSUMA_API_KEY = process.env.SATSUMA_API_KEY;

  if (!SATSUMA_API_KEY) {
    // Use SDK default
    return;
  }
  switch (network) {
    case Network.Optimism:
      return version === Version.Avalon
        ? `https://subgraph.satsuma-prod.com/${SATSUMA_API_KEY}/lyra/optimism-mainnet/api`
        : `https://subgraph.satsuma-prod.com/${SATSUMA_API_KEY}/lyra/optimism-mainnet-newport/api`;
    case Network.Arbitrum:
      return `https://subgraph.satsuma-prod.com/${SATSUMA_API_KEY}/lyra/arbitrum-mainnet/api`;
  }
};

const getLyraGovSubgraphURI = (network) => {
  const SATSUMA_API_KEY = process.env.SATSUMA_API_KEY;
  if (!SATSUMA_API_KEY) {
    // Use SDK default
    return;
  }
  switch (network) {
    case Network.Optimism:
      return `https://subgraph.satsuma-prod.com/${SATSUMA_API_KEY}/lyra/optimism-governance/api`;
    case Network.Arbitrum:
      return `https://subgraph.satsuma-prod.com/${SATSUMA_API_KEY}/lyra/arbitrum-governance/api`;
  }
};

const sendFormattedStrikes = async (channel, message) => {
  const logo = new AttachmentBuilder("./lyra-logo.png");

  for (const strike of message) {
    const embed = new EmbedBuilder()
      .setColor([86, 195, 169, 1])
      .setTitle(`Strike Price: $${strike.strikePrice}`)
      .setURL(
        `https://app.lyra.finance/#/trade/${
          selectedChain === "OP" ? "optimism" : "arbitrum"
        }/${formattedUnderlying.toLowerCase()}?expiry=${selectedExpiry}`
      )
      .setThumbnail("attachment://lyra-logo.png")
      .addFields(
        {
          name: "Price Per Option: ",
          value: `$${strike.pricePerOption}`,
          inline: true,
        },
        {
          name: "Break Even: ",
          value: `$${strike.breakEven}`,
          inline: true,
        },
        {
          name: "To Break Even: ",
          value: `${
            strike.toBreakEven >= 0
              ? `$${strike.toBreakEven}`
              : `-$${Math.abs(strike.toBreakEven)}`
          }`,
          inline: true,
        },
        {
          name: "Open Interest: ",
          value: `${
            strike.openInterest.gt(0)
              ? formatTruncatedUSD(strike.openInterest)
              : "-"
          }`,
          inline: true,
        },
        {
          name: "Skew: ",
          value: `${strike.skew}`,
          inline: true,
        },
        {
          name: "Base IV: ",
          value: `${strike.baseIv}`,
          inline: true,
        },
        {
          name: "Volatility: ",
          value: `${strike.vol}`,
          inline: true,
        },
        {
          name: "Vega: ",
          value: `${strike.vega}`,
          inline: true,
        },
        {
          name: "Gamma: ",
          value: `${strike.gamma}`,
          inline: true,
        },
        {
          name: "Delta: ",
          value: `${strike.delta}`,
          inline: true,
        },
        {
          name: "Theta: ",
          value: `${strike.theta}`,
          inline: true,
        },
        {
          name: "Rho: ",
          value: `${strike.rho}`,
          inline: true,
        },
        {
          name: "Available Liquidity: ",
          value: `${strike.availableLiquidity} contracts`,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: `${isBuy ? "Buy" : "Sell"} | ${
          isCall ? "Call" : "Put"
        } | Slippage: ${selectedSlippage * 100}%`,
      });

    await channel.send({ embeds: [embed], files: [logo] });
  }
};

async function getMarket(chain, formattedUnderlying) {
  let market;
  while (!market) {
    if (chain === "OP" && OP_MARKETS) {
      market = OP_MARKETS.find(
        (market) =>
          market.name.toLowerCase() === formattedUnderlying.toLowerCase()
      );
    } else if (chain === "ARB" && ARB_MARKETS) {
      market = ARB_MARKETS.find(
        (market) =>
          market.name.toLowerCase() === formattedUnderlying.toLowerCase()
      );
    }
    if (!market) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return market;
}

dotenv.config();
client.login(process.env.DISCORD_BOT_TOKEN);

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Function to initialize Lyra objects
  const initializeLyraObjects = async () => {
    const OP_PROVIDER = new StaticJsonRpcProvider(
      { skipFetchSetup: true, url: process.env.OP_MAINNET_URL },
      10
    );

    const ARB_PROVIDER = new StaticJsonRpcProvider(
      { skipFetchSetup: true, url: process.env.ARB_MAINNET_URL },
      42161
    );

    OP_LYRA = new Lyra({
      provider: OP_PROVIDER,
      apiUri: process.env.API_URL,
      subgraphUri: getLyraSubgraphURI(Network.Optimism, Version.Newport),
      govSubgraphUri: getLyraGovSubgraphURI(Network.Optimism),
      version: Version.Newport,
    });

    ARB_LYRA = new Lyra({
      provider: ARB_PROVIDER,
      apiUri: process.env.REACT_APP_API_URL,
      subgraphUri: getLyraSubgraphURI(Network.Arbitrum, Version.Newport),
      govSubgraphUri: getLyraGovSubgraphURI(Network.Arbitrum),
      version: Version.Newport,
    });
    OP_MARKETS = await OP_LYRA.markets();

    ARB_MARKETS = await ARB_LYRA.markets();
  };

  // Initialize Lyra objects when the bot is ready
  await initializeLyraObjects();

  // Refresh Lyra objects every 10 minutes (600000 milliseconds)
  setInterval(async () => {
    await initializeLyraObjects();
    console.log("Lyra objects refreshed");
  }, 60000);

  const command = [
    {
      name: "getallstrikes",
      description: "Get all strikes for a given market and expiry",
    },
  ];

  await client.application?.commands.set(command);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.type === 2 && interaction.commandName === "getallstrikes") {
      await interaction.deferReply();
      const row = createStringSelectMenu(
        "chain-select",
        "Select a chain",
        CHAIN_OPTIONS
      );

      const response = await interaction.editReply({
        content: "Please select a chain:",
        components: [row],
        ephemeral: true,
        fetchReply: true,
      });

      prevMessageId = response.id;
    } else if (interaction.isMessageComponent()) {
      if (interaction.customId === "chain-select") {
        await interaction.deferReply();
        selectedChain = interaction.values[0];

        const disabledRow = createStringSelectMenu(
          "chain-select",
          selectedChain,
          CHAIN_OPTIONS
        );

        await interaction.webhook.editMessage(prevMessageId, {
          components: [disabledRow],
        });

        const row = createStringSelectMenu(
          "market-select",
          "Select a market",
          selectedChain === "OP" ? OP_MARKET_OPTIONS : ARB_MARKET_OPTIONS
        );

        const response = await interaction.editReply({
          content: `Please select a market:`,
          components: [row],
        });

        prevMessageId = response.id;
      } else if (interaction.customId === "market-select") {
        await interaction.deferReply();
        selectedMarket = interaction.values[0];

        formattedUnderlying = formatUnderlying(selectedChain, selectedMarket);

        market = await getMarket(selectedChain, formattedUnderlying);

        board = market.liveBoards();

        for (let i = 0; i < board.length; i++) {
          if (!expiries.includes(board[i].expiryTimestamp)) {
            if (
              !expiries.some(
                (expiry) =>
                  expiry.timeStamp === board[i].expiryTimestamp.toString()
              )
            ) {
              const dateAndTimestamp = formatDateAndTimestamp(
                board[i].expiryTimestamp,
                userTimezone
              );

              expiries.push(dateAndTimestamp);
            }
          }
        }

        const disabledRow = createStringSelectMenu(
          "market-select",
          selectedMarket,
          selectedChain === "OP" ? OP_MARKET_OPTIONS : ARB_MARKET_OPTIONS
        );

        await interaction.webhook.editMessage(prevMessageId, {
          components: [disabledRow],
        });

        expiryOptions = createExpiryOptions(expiries);
        const row = createStringSelectMenu(
          "expiry-select",
          "Select an expiry",
          expiryOptions
        );

        const response = await interaction.editReply({
          content: `Please select an expiry:`,
          components: [row],
        });

        prevMessageId = response.id;
      } else if (interaction.customId === "expiry-select") {
        selectedExpiry = parseInt(interaction.values[0]);
        await interaction.deferReply();

        const row = createStringSelectMenu(
          "slippage-select",
          "Select slippage tolerance",
          SLIPPAGE_OPTIONS
        );

        const disabledRow = createStringSelectMenu(
          "expiry-select",
          formatDateTime(selectedExpiry, userTimezone),
          expiryOptions
        );

        await interaction.webhook.editMessage(prevMessageId, {
          components: [disabledRow],
        });

        const response = await interaction.editReply({
          content: `Please select slippage tolerance:`,
          components: [row],
        });

        prevMessageId = response.id;
      } else if (interaction.customId === "slippage-select") {
        selectedSlippage = parseFloat(interaction.values[0]);
        await interaction.deferReply();

        const row = createStringSelectMenu(
          "isBuy-select",
          "Select Buy / Sell",
          ISBUY_OPTIONS
        );

        const disabledRow = createStringSelectMenu(
          "slippage-select",
          `${(selectedSlippage * 100).toString()}%`,
          SLIPPAGE_OPTIONS
        );

        await interaction.webhook.editMessage(prevMessageId, {
          components: [disabledRow],
        });

        const response = await interaction.editReply({
          content: `Please select Buy / Sell:`,
          components: [row],
        });

        prevMessageId = response.id;
      } else if (interaction.customId === "isBuy-select") {
        isBuy = interaction.values[0] === "true";
        await interaction.deferReply();

        const row = createStringSelectMenu(
          "isCall-select",
          "Select Call / Put",
          ISCALL_OPTIONS
        );

        const disabledRow = createStringSelectMenu(
          "isBuy-select",
          isBuy ? "Buy" : "Sell",
          ISBUY_OPTIONS
        );

        await interaction.webhook.editMessage(prevMessageId, {
          components: [disabledRow],
        });

        const response = await interaction.editReply({
          content: `Please select Call / Put:`,
          components: [row],
        });

        prevMessageId = response.id;
      } else if (interaction.customId === "isCall-select") {
        isCall = interaction.values[0] === "true";

        await interaction.deferReply();

        const disabledRow = createStringSelectMenu(
          "isCall-select",
          isCall ? "Call" : "Put",
          ISCALL_OPTIONS
        );

        await interaction.webhook.editMessage(prevMessageId, {
          components: [disabledRow],
        });

        board = market
          .liveBoards()
          .find((board) => board.expiryTimestamp === parseInt(selectedExpiry));

        filteredStrikes = board
          .strikes()
          .map((strike) => {
            const quote = strike.quoteSync(isCall, isBuy, CONTRACT_SIZE, {
              iterations: 3,
            });

            const option = strike.option(isCall);

            if (strike.isDeltaInRange && quote && option) {
              return {
                strike: strike,
                breakEven: quote.breakEven,
                toBreakEven: quote.toBreakEven,
                pricePerOption: quote.pricePerOption,
                fairIv: quote.fairIv,
                iv: quote.iv,
                greeks: quote.greeks,
                longOpenInterest: option.longOpenInterest,
                shortOpenInterest: option.shortOpenInterest,
                spotPrice: option.market().spotPrice,
              };
            } else {
              return null;
            }
          })
          .filter((obj) => obj !== null);

        const strikes = await getAllStrikes(
          filteredStrikes,
          isBuy,
          isCall,
          selectedSlippage
        );

        await sendFormattedStrikes(interaction.channel, strikes);

        const response = await interaction.editReply(
          `Here are all the strikes and their available liquidities for ${formatDateTime(
            selectedExpiry,
            userTimezone
          )}:`
        );

        prevMessageId = response.id;
      }
    }
  } catch (error) {
    console.error(error);
    await interaction.channel.send(
      "There was an error processing the request. Please try again."
    );
  }
});
