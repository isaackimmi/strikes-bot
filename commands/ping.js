export const ping = {
  name: "ping",
  description: "Ping the bot to check if it is online.",
  execute(client, message, args) {
    message.channel.send("Pong!");
  },
};
