import { StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";

export const createStringSelectMenu = (
  customId,
  placeholder,
  options,
  disabled = false
) => {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addOptions(options)
      .setDisabled(disabled)
  );
};
