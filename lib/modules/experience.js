module.exports = inject;

function inject (bot) {
  bot.experience = {
    level: 0,
    points: 0,
    progress: 0
  }
  bot._client.on('experience', (packet) => {
    bot.experience.level = packet.level;
    bot.experience.points = packet.totalExperience;
    bot.experience.progress = packet.experienceBar;
    bot.emit('experience');
  });
}
