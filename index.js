import Discord from "discord.js";
import Lyra from "@lyrafinance/lyra-js";

import config from "./config.js";
import { getAllStrikes } from "./commands/getAllStrikes.js";
import { whatDaoIDo } from "./commands/whatDaoIDo.js";

const client = new Discord.Client();
let lyra;

function splitIntoChunks(text) {
  const chunks = [];

  for (let i = 0; i < text.length; i += 2000) {
    chunks.push(text.substring(i, i + 2000));
  }

  return chunks;
}

async function sendFormattedStrikes(channel, message) {
  const chunks = splitIntoChunks(message);

  for (const chunk of chunks) {
    await channel.send(chunk);
  }
}

// Event listeners
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  //const market = await lyra.market("eth");

  //console.log(market.liveBoards());
});

client.on("message", async (message) => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "getallstrikes") {
    // Buy/Sell
    if (args[3].toLowerCase() === "buy") {
      args[3] = true;
    } else {
      args[3] = false;
    }

    // Call/Put
    if (args[4].toLowerCase() === "call") {
      args[4] = true;
    } else {
      args[4] = false;
    }

    const [underlying, expiry, network, isBuy, isCall] = args;

    if (network === "OP") {
      lyra = new Lyra(config.opChainID);
    } else if (network === "ARB") {
      lyra = new Lyra(config.arbChainID);
    }

    const strikes = await getAllStrikes(
      lyra,
      underlying.toUpperCase(),
      expiry,
      network,
      isBuy,
      isCall
    );

    console.log(strikes);

    const formattedStrikes = strikes
      .map(
        (strike) =>
          `\nStrike Price: $${strike.strikePrice}\n` +
          `Price Per Option = $${strike.pricePerOption}\n` +
          `Break Even = $${strike.breakEven}\n` +
          `To Break Even = ${strike.toBreakEven}\n` +
          `Open Interest = ${strike.openInterest}\n` +
          `Skew = ${strike.skew}\n` +
          `Base IV = ${strike.baseIv}\n` +
          `Volatility = ${strike.vol}\n` +
          `Vega = ${strike.vega}\n` +
          `Gamma = ${strike.gamma}\n` +
          `Delta = ${strike.delta}\n` +
          `Theta = ${strike.theta}\n` +
          `Rho = ${strike.rho}\n`
      )
      .join("");

    await sendFormattedStrikes(message.channel, formattedStrikes);
  } else if (command === "help") {
  }
});

client.login(config.token);
