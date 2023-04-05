import { Bot } from "mineflayer";
import { Movements } from "mineflayer-pathfinder";

import MinecraftData from "minecraft-data";

import logger from "../logger";

import config from "../../qbot.config.json";
import { sleep } from "../utils/common";
import startBot from "../startBot";

/**
 * This plugin is used to handle events that are not specific to any other
 * plugin.
 *
 * This plugin should always come after the pathfinder plugin, since it loads
 * the pathfinder movements.
 *
 * @param bot The bot.
 */
export default function corePlugin(bot: Bot): void {
  fixWhisper(bot);
  loadPathfinderMovements(bot);

  bot.once("spawn", handleSpawn);

  bot.on(
    "kicked",
    async (reason, loggedIn) => await handleKick(bot, reason, loggedIn)
  );
}

/**
 * Handles when the bot spawns in.
 */
function handleSpawn(): void {
  logger.info("Spawned");
}

/**
 * Handles when the bot gets kicked.
 *
 * @param bot The bot.
 * @param reason The reason for the kick.
 * @param loggedIn Whether the bot was logged in when kicked.
 */
async function handleKick(
  bot: Bot,
  reason: string,
  loggedIn: boolean
): Promise<void> {
  // The reason is actually a JSON string that contains the reason in the "text"
  // property. This parses the JSON string and gets the "text" property.
  reason = JSON.parse(reason).text;

  if (!reason) {
    logger.error("Kicked from server for no reason");
  } else {
    logger.error(`Kicked from server: "${reason}"`);
  }

  await reconnectOnKick(bot);
}

/**
 * Reconnects the bot if the bot gets kicked.
 *
 * @param bot The bot.
 */
async function reconnectOnKick(bot: Bot): Promise<void> {
  const reconnectOnKick = config.plugins.core.reconnectOnKick;
  if (reconnectOnKick.enabled) {
    logger.info(`Reconnecting in ${reconnectOnKick.delay}ms`);
    await sleep(reconnectOnKick.delay);

    await startBot();
  }
}

/**
 * Loads the pathfinder movements.
 *
 * @param bot The bot.
 */
function loadPathfinderMovements(bot: Bot): void {
  const movements = new Movements(bot, MinecraftData(bot.version));
  bot.pathfinder.setMovements(movements);
}

/**
 * Fix the whisper command, since on newer versions of Minecraft, the `/tell`
 * command is no longer available. This uses `/w` instead.
 *
 * @param bot The bot.
 */
function fixWhisper(bot: Bot): void {
  // TODO: PR this to Mineflayer
  bot.whisper = (username: string, message: string) => {
    bot.chat(`/w ${username} ${message}`);
  };
}