import Discord, {
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} from "discord.js";
import Lyra, { Chain } from "@lyrafinance/lyra-js";

import config from "./config.js";
//import { getAllStrikes } from "./commands/getAllStrikes.js";
import { createExpiryOptions } from "./utils/createExpiryOptions.js";
import { whatDaoIDo } from "./utils/whatDaoIDo.js";
import { formatTruncatedUSD } from "./utils/formatTruncatedUSD.js";
import { formatUnderlying } from "./utils/formatUnderlying.js";
import { formatDateAndTimestamp } from "./utils/formatDateAndTimeStamp.js";

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

let lyra;
let selectedChain;
let selectedMarket;
let expiries = [];
let selectedExpiry;
let selectedSlippage;

const splitIntoChunks = (text) => {
  const chunks = [];

  for (let i = 0; i < text.length; i += 2000) {
    chunks.push(text.substring(i, i + 2000));
  }

  return chunks;
};
const sendFormattedStrikes = async (channel, message) => {
  const chunks = splitIntoChunks(message);

  for (const chunk of chunks) {
    await channel.send(chunk);
  }
};

client.login(config.token);

// Event listeners
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const command = [
    {
      name: "getallstrikes",
      description: "Get all strikes for a given market and expiry",
    },
  ];

  const commands = await client.application?.commands.set(command);

  //console.log(commands);
});

client.on("interactionCreate", async (interaction) => {
  //console.log(`New interaction received: ${interaction.type}`);
  //console.log(interaction.isMessageComponent());
  //if (!interaction.isCommand()) return;

  try {
    if (interaction.type === 2 && interaction.commandName === "getallstrikes") {
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
      await interaction.reply({
        content: "Please select a chain:",
        components: [row],
        ephemeral: true,
      });
    } else if (interaction.isMessageComponent()) {
      if (interaction.customId === "chain-select") {
        selectedChain = interaction.values[0];

        if (selectedChain === "OP") {
          lyra = new Lyra(Chain.Optimism);
        } else if (selectedChain === "ARB") {
          lyra = new Lyra(Chain.Arbitrum);
        }

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

        await interaction.reply({
          content: `You chose ${selectedChain}. Please select a market:`,
          components: [row],
        });
      } else if (interaction.customId === "market-select") {
        selectedMarket = interaction.values[0];

        const markets = await lyra.markets();

        const formattedUnderlying = formatUnderlying(
          selectedChain,
          selectedMarket
        );

        const market = markets.find(
          (market) =>
            market.name.toLowerCase() === formattedUnderlying.toLowerCase()
        );

        const board = market.liveBoards();

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

        await interaction.reply({
          content: `You chose ${selectedMarket}. Please select an expiry:`,
          components: [row],
        });
      } else if (interaction.customId === "expiry-select") {
        selectedExpiry = parseInt(interaction.values[0]);

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("slippage-select")
            .setPlaceholder("Select a slippage tolerance")
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
          content: `You chose ${selectedChain}. Please select a slippage tolerance:`,
          components: [row],
        });
      } else if (interaction.customId === "slippage-select") {
        selectedSlippage = parseFloat(interaction.values[0]);
        //console.log(selectedChain);
        //console.log(selectedMarket);
        //console.log(selectedExpiry);
        //console.log(selectedSlippage);

        //const strikes = await getAllStrikes(
        //  lyra,
        //  underlying.toUpperCase(),
        //  expiry,
        //  network,
        //  isBuy,
        //  isCall,
        //  slippage
        //);
        //const formattedStrikes = strikes
        //  .map(
        //    (strike) =>
        //      `\nStrike Price: $${strike.strikePrice}\n` +
        //      `Price Per Option = $${strike.pricePerOption}\n` +
        //      `Break Even = $${strike.breakEven}\n` +
        //      `To Break Even = ${strike.toBreakEven}\n` +
        //      `Open Interest = ${
        //        strike.openInterest.gt(0)
        //          ? formatTruncatedUSD(strike.openInterest)
        //          : "-"
        //      }\n` +
        //      `Skew = ${strike.skew}\n` +
        //      `Base IV = ${strike.baseIv}\n` +
        //      `Volatility = ${strike.vol}\n` +
        //      `Vega = ${strike.vega}\n` +
        //      `Gamma = ${strike.gamma}\n` +
        //      `Delta = ${strike.delta}\n` +
        //      `Theta = ${strike.theta}\n` +
        //      `Rho = ${strike.rho}\n` +
        //      `Available Liquidity = ${strike.availableLiquidity} options\n`
        //  )
        //  .join("");

        //await sendFormattedStrikes(interaction.channel, formattedStrikes);
      }
    }
  } catch (error) {
    console.log(error);

    //console.log(ComponentType.StringSelect);
    //console.log(interaction);
  }
});

//client.on("interactionCreate", async (interaction) => {
//  console.log("handler");
//  if (!interaction.isCommand()) return;

//  if (interaction.commandName === "getallstrikes") {
//    const network = interaction.options.getString("network");

//    console.log(network);
//  }
//});

//client.on("interactionCreate", async (interaction) => {
//  //if (!message.content.startsWith(config.prefix) || message.author.bot) return;
//  //const args = message.content.slice(config.prefix.length).trim().split(/ +/);
//  //const command = args.shift().toLowerCase();
//  if (!interaction.isCommand()) return;

//  const { commandName } = interaction;

//  if (commandName === "getallstrikes") {
//    console.log("interaction working");
//    // Buy/Sell
//    //if (args[3].toLowerCase() === "buy") {
//    //  args[3] = true;
//    //} else {
//    //  args[3] = false;
//    //}
//    //// Call/Put
//    //if (args[4].toLowerCase() === "call") {
//    //  args[4] = true;
//    //} else {
//    //  args[4] = false;
//    //}
//    //const [underlying, expiry, network, isBuy, isCall, slippage] = args;
//    //if (network === "OP") {
//    //  lyra = new Lyra(Chain.Optimism);
//    //} else if (network === "ARB") {
//    //  lyra = new Lyra(Chain.Arbitrum);
//    //}
//    //// ADD CODE HERE
//    const strikes = await getAllStrikes(
//      lyra,
//      underlying.toUpperCase(),
//      expiry,
//      network,
//      isBuy,
//      isCall,
//      slippage
//    );
//    const formattedStrikes = strikes
//      .map(
//        (strike) =>
//          `\nStrike Price: $${strike.strikePrice}\n` +
//          `Price Per Option = $${strike.pricePerOption}\n` +
//          `Break Even = $${strike.breakEven}\n` +
//          `To Break Even = ${strike.toBreakEven}\n` +
//          `Open Interest = ${
//            strike.openInterest.gt(0)
//              ? formatTruncatedUSD(strike.openInterest)
//              : "-"
//          }\n` +
//          `Skew = ${strike.skew}\n` +
//          `Base IV = ${strike.baseIv}\n` +
//          `Volatility = ${strike.vol}\n` +
//          `Vega = ${strike.vega}\n` +
//          `Gamma = ${strike.gamma}\n` +
//          `Delta = ${strike.delta}\n` +
//          `Theta = ${strike.theta}\n` +
//          `Rho = ${strike.rho}\n` +
//          `Available Liquidity = ${strike.availableLiquidity} options\n`
//      )
//      .join("");
//    await sendFormattedStrikes(message.channel, formattedStrikes);
//  } else if (command === "whatDaoIDo") {
//  } else {
//    await message.channel.send(
//      "Invalid command. To see all available commands type !whatDaoIDo"
//    );
//  }
//});
