module.exports = inject;

function inject(client, bot) {
  const conv = require('../../conversions');

  client.on('position_look', (packet) => {
    if (bot.majorVersion === '1.8') {
      bot.entity.position.set(packet.x / 32, packet.y / 32, packet.z / 32);
    } else {
      bot.entity.position.set(packet.x, packet.y, packet.z);
    }

    bot.entity.yaw = packet.yaw
    bot.entity.pitch = packet.pitch
  });

  client.on('position', (packet) => {
    if (bot.majorVersion === '1.8') {
      bot.entity.position.set(packet.x / 32, packet.y / 32, packet.z / 32);
    } else {
      bot.entity.position.set(packet.x, packet.y, packet.z);
    }
  });

  client.on('look', (packet) => {
    bot.entity.yaw = packet.yaw
    bot.entity.pitch = packet.pitch
  });

}
