import Discord from "discord.js";
import Lyra from "@lyrafinance/lyra-js";
import config from "./config.js";
import { getAllStrikes } from "./commands/getAllStrikes.js";
import { whatDaoFuck } from "./commands/whatDaoFuck.js";

const lyra = new Lyra();

const client = new Discord.Client();

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

  //console.log(market.liveBoards()[1]);
});

client.on("message", async (message) => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "getallstrikes") {
    const [underlying, expiry] = args;

    const strikes = await getAllStrikes(lyra, underlying, expiry);

    const formattedStrikes = strikes
      .map(
        (strike) =>
          `\nStrike Price: $${strike.strikePrice}\n` +
          `Skew = ${strike.skew}\n` +
          `IV = ${strike.iv}\n` +
          `Volatility = ${strike.vol}\n` +
          `Vega = ${strike.vega}\n` +
          `Gamma = ${strike.gamma}\n` +
          `Open Interest = ${strike.openInterest}\n`
      )
      .join("");

    await sendFormattedStrikes(message.channel, formattedStrikes);
  } else if (command === "help") {
  }
});

client.login(config.token);
