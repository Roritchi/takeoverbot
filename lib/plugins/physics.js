const Vec3 = require('vec3').Vec3;

module.exports = { init, start, stop,
  name: 'Physics(Gravity)',
}

var onTickInt;

const dacc = 0.001;
var accel = dacc;

function init(bot) {

}

function start(bot) {
  onTickInt = setInterval(async() => {
  //  if(bot.game.dimension !== 0) return;
    let pos = new Vec3(Math.floor(bot.entity.position.x), Math.floor(bot.entity.position.y - accel), Math.floor(bot.entity.position.z));
    let chunk = (await bot.world.getColumnAt(pos));
    if(chunk) {
      let block = await chunk.getBlockType(posInChunk(pos));
      if(block === 0) {
        bot.entity.position.y -= accel;
        accel *= 2;
        bot._client.write('position', {
          x: bot.entity.position.x,
          y: bot.entity.position.y,
          z: bot.entity.position.z,
          onGround: false
        });
      } else {
        accel /= 2;
      }
    } else {
      accel = dacc;
    }
    if(accel > 0.5) accel = 0.5;
    if(accel < dacc) accel = dacc;
  }, 50);
}

function stop(bot) {
  if(onTickInt) {
    clearInterval(onTickInt);
    onTickInt = null;
  }
}

function posInChunk (pos) {
  return pos.floored().modulus(new Vec3(16, 256, 16))
}
