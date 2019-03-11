
module.exports = { init, start, stop,
  name: 'AntiAFK',
}

var turnInterval;
var turnVal;

function init(bot) {
  turnInterval = null;
  turnVal = 0;
}

function start(bot) {
  if(turnInterval) clearInterval(turnInterval);
  turnInterval = setInterval(() => {
    turnVal += 10 / 3;
    bot._client.write('look', {
      yaw: (turnVal % 360) - 180,
      pitch: ((turnVal % 30) - 15),
      onGround: false
    });
    bot._client.write('position', {
      x: bot.entity.position.x/* + (Math.random() / 4) - (1 / 8)*/,
      y: bot.entity.position.y,
      z: bot.entity.position.z/* + (Math.random() / 4) - (1 / 8)*/,
      onGround: false
    });
    if(turnVal % 64 < 5) {
      bot._client.write('arm_animation', { hand: 0 });
      bot._client.write('position_look', {
        x: bot.entity.position.x,
        y: bot.entity.position.y,
        z: bot.entity.position.z,
        yaw: (turnVal % 360) - 180,
        pitch: ((turnVal % 30) - 15),
        onGround: false
      });
    }
  }, 50);
}

function stop(bot) {
  if(turnInterval) clearInterval(turnInterval);
  turnInterval = null;
}
