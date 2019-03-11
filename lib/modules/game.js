module.exports = inject;

function inject(bot) {
  bot.game = {}

  bot._client.on('login', (packet) => {
    bot.game.levelType = packet.levelType;
    bot.game.gameMode = packet.gameMode;
    bot.game.dimension = packet.dimension;
    bot.game.difficulty = packet.difficulty;
    bot.game.maxPlayers = packet.maxPlayers;

    bot.game.time = [0, 0];
    bot.game.age = [0, 0];
    bot.game.raining = false;

    // set header and footer to watermark ;)
    bot.game.header = JSON.stringify({ text: "* ~ # TakeoverBot # ~ *" });
    bot.game.footer = JSON.stringify({ text: "*--*" });

    bot.emit('login');
    bot.emit('game');

    // set hotbar slot to 0
    bot._client.write('held_item_slot', { slotId: 0 });
    if(bot.majorVersion === '1.13')
      bot._client.write('custom_payload', { channel: 'minecraft:brand', data: Buffer.from('\x07vanilla') });
    else
      bot._client.write('custom_payload', { channel: 'MC|Brand', data: Buffer.from('\x07vanilla') });

  });

  // update world information on respawn
  bot._client.on('respawn', (packet) => {
    bot.emit('dimension', bot.game.dimension, packet.dimension);
    bot.game.levelType = packet.levelType;
    bot.game.gameMode = packet.gamemode;
    bot.game.dimension = packet.dimension;
    bot.game.difficulty = packet.difficulty;
    bot.emit('game');
  });

  // update difficulty
  bot._client.on('difficulty', (packet) => {
    bot.game.difficulty = packet.difficulty;
  });

  // update time and world age
  bot._client.on('update_time', (packet) => {
    bot.time = packet.time;
    bot.age = packet.age;
  });

  // save header and footer
  bot._client.on('playerlist_header', (packet) => {
    if(packet.header) bot.game.header = packet.header;
    if(packet.footer) bot.game.footer = packet.footer;
  });

  // Gamemode and other Game States
  bot._client.on('game_state_change', (packet) => {
    console.log(packet);
    if(packet.reason === 3) {
      bot.game.gameMode = packet.gameMode;
      bot.emit('game');
    } else if(packet.reason === 2) {
      // start raining
      bot.game.raining = true;
    } else if(packet.reason === 1) {
      // stop raining
      bot.game.raining = false;
    }
  });

}
