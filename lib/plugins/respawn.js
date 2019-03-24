module.exports = { init, start, stop,
  name: 'AutoRespawn',
}

var b;

function init(bot) {

}

function start(bot) {
  b = bot;
  console.log('started');
  bot._client.on('entity_status', onDeath);
}

function stop(bot) {
  console.log('stop');
  bot._client.removeListener('entity_status', onDeath);
}

function onDeath(packet) {
  if(packet.entityId === b.entity.id && packet.entityStatus === 2) {
    b._client.write('client_command', {
      actionId: 0
    });
  }
}
