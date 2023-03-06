import Discord from "discord.js";
import Lyra from "@lyrafinance/lyra-js";
import { ping } from "./commands/ping.js";
import { getAllStrikes } from "./commands/getAllStrikes.js";
import config from "./config.js";

const lyra = new Lyra();

const client = new Discord.Client();

async function run() {
  const markets = await lyra.markets();

  //console.log(
  //  markets[0].liveBoards().map((board) => ({
  //    id: board.id,
  //    expiryTimestamp: board.expiryTimestamp,
  //    strikes: board.strikes().map((strike) => ({
  //      id: strike.id,
  //      strikePrice: strike.strikePrice,
  //    })),
  //  }))
  //  //markets.map((market) => ({
  //  //  address: market.address,
  //  //  name: market.name,
  //  //  expiries: market.liveBoards().map((board) => ({
  //  //    id: board.id,
  //  //    expiryTimestamp: board.expiryTimestamp,
  //  //    strikes: board.strikes().map((strike) => ({
  //  //      id: strike.id,
  //  //      strikePrice: strike.strikePrice,
  //  //    })),
  //  //  })),
  //  //}))
  //);
}

// Event listeners
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  run();
});

client.on("message", async (message) => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  //if (command === "ping") {
  //  ping.execute(client, message, args);
  //}

  if (command === "getallstrikes") {
    const [underlying, expiry] = args;
    const strikes = await getAllStrikes(underlying, expiry);

    console.log(strikes);
    if (typeof strikes === "string") {
      message.reply(strikes);
    } else {
      const formattedStrikes = strikes
        .map(
          (strike) =>
            `${strike.strikePrice}: Call Liquidity = ${strike.callLiquidity}, Put Liquidity = ${strike.putLiquidity}`
        )
        .join("\n");
      message.reply(`Strikes:\n${formattedStrikes}`);
    }
  }
});

client.login(config.token);
