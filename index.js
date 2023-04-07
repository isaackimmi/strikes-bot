import Discord, {
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  bold,
  AttachmentBuilder,
} from "discord.js";
import Lyra, { Chain } from "@lyrafinance/lyra-js";

import config from "./config.js";
import { getAllStrikes } from "./commands/getAllStrikes.js";
import { createExpiryOptions } from "./utils/createExpiryOptions.js";
import { formatTruncatedUSD } from "./utils/formatTruncatedUSD.js";
import { formatUnderlying } from "./utils/formatUnderlying.js";
import { formatDateAndTimestamp } from "./utils/formatDateAndTimeStamp.js";
import { CONTRACT_SIZE } from "./constants.js";
import { fromUnixEpoch } from "./utils/fromUnixEpoch.js";

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
let market;
let board;
let filteredStrikes = [];

const sendFormattedStrikes = async (channel, message) => {
  const logo = new AttachmentBuilder("./lyra-logo.png");

  message.forEach(async (strike) => {
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

    // Added setTimeout in order to keep the strikes in ascending order.
    // without this the strikes are displayed in random order.
    setTimeout(() => {
      channel.send({ embeds: [embed], files: [logo] });
    }, 1000);
    //channel.send({ embeds: [embed], files: [logo] });
    //await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
  });
};

client.login(config.token);

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  OP_LYRA = new Lyra(Chain.Optimism);
  ARB_LYRA = new Lyra(Chain.Arbitrum);
  OP_MARKETS = await OP_LYRA.markets();
  ARB_MARKETS = await ARB_LYRA.markets();

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
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("chain-select")
          .setPlaceholder("Select a chain")
          .addOptions([
            {
              label: "Optimism",
              value: "OP",
            },
            {
              label: "Arbitrum",
              value: "ARB",
            },
          ])
      );

      await interaction.followUp({
        content: "Please select a chain:",
        components: [row],
        ephemeral: true,
      });
    } else if (interaction.isMessageComponent()) {
      if (interaction.customId === "chain-select") {
        await interaction.deferReply();
        selectedChain = interaction.values[0];

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("market-select")
            .setPlaceholder("Select a market")
            .addOptions([
              {
                label: "ETH",
                value: "ETH",
              },
              {
                label: "BTC",
                value: "BTC",
              },
            ])
        );

        await interaction.editReply({
          content: `Please select a market:`,
          components: [row],
        });
      } else if (interaction.customId === "market-select") {
        await interaction.deferReply();
        selectedMarket = interaction.values[0];

        formattedUnderlying = formatUnderlying(selectedChain, selectedMarket);

        if (selectedChain === "OP" && OP_MARKETS) {
          market = OP_MARKETS.find(
            (market) =>
              market.name.toLowerCase() === formattedUnderlying.toLowerCase()
          );
        } else if (selectedChain === "ARB" && ARB_MARKETS) {
          market = ARB_MARKETS.find(
            (market) =>
              market.name.toLowerCase() === formattedUnderlying.toLowerCase()
          );
        }

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
                board[i].expiryTimestamp
              );

              expiries.push(dateAndTimestamp);
            }
          }
        }

        const expiryOptions = createExpiryOptions(expiries);
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("expiry-select")
            .setPlaceholder("Select an expiry")
            .addOptions(expiryOptions)
        );

        await interaction.editReply({
          content: `Please select an expiry:`,
          components: [row],
        });
      } else if (interaction.customId === "expiry-select") {
        selectedExpiry = parseInt(interaction.values[0]);
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("slippage-select")
            .setPlaceholder("Select slippage tolerance")
            .addOptions([
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
            ])
        );

        await interaction.reply({
          content: `Please select slippage tolerance:`,
          components: [row],
        });
      } else if (interaction.customId === "slippage-select") {
        selectedSlippage = parseFloat(interaction.values[0]);

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("isBuy-select")
            .setPlaceholder("Select Buy / Sell")
            .addOptions([
              {
                label: "Buy",
                value: "true",
              },
              {
                label: "Sell",
                value: "false",
              },
            ])
        );

        await interaction.reply({
          content: `Please select Buy / Sell:`,
          components: [row],
        });
      } else if (interaction.customId === "isBuy-select") {
        isBuy = interaction.values[0] === "true";
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("isCall-select")
            .setPlaceholder("Select Call / Put")
            .addOptions([
              {
                label: "Call",
                value: "true",
              },
              {
                label: "Put",
                value: "false",
              },
            ])
        );

        await interaction.reply({
          content: `Please select Call / Put:`,
          components: [row],
        });
      } else if (interaction.customId === "isCall-select") {
        isCall = interaction.values[0] === "true";

        await interaction.deferReply();

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

        await interaction.editReply(
          `Here are all the strikes and their available liquidities for ${fromUnixEpoch(
            selectedExpiry
          )}:`
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
});
