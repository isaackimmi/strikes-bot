import Discord from "discord.js";
import config from "./config.js";
import { ping } from "./commands/ping.js";

const client = new Discord.Client();

// Event listeners
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (message) => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    ping.execute(client, message, args);
  }
});

client.login(config.token);
