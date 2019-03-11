const Vec3 = require('vec3').Vec3;

function inject(bot) {

  const Chunk = require('prismarine-chunk')(bot.majorVersion);
  const World = require('prismarine-world')(bot.majorVersion);
  const Block = require('prismarine-block')(bot.version);

  bot.world = new World();

  bot._client.on('map_chunk', (packet) => {
    //if(packet.blockEntities.length > 0) console.log(packet.blockEntities);
    try {
      let c = new Chunk();
      c.load(packet.chunkData, packet.bitMap, bot.game.dimension === 0);
      c.bitMap = packet.bitMap;
      c.groundUp = packet.groundUp;
      c.blockEntities = packet.blockEntities;
      c.raw = packet.chunkData;
      bot.world.setColumn(packet.x, packet.z, c);
    } catch(err) {
      console.log('chunkerr', err);
    }
  });

  bot.on('dimension', (d1, d2) => {
    if(d1 !== d2) {
      bot.world.columns = {};
      bot.world.columnsArray = [];
    }
  });

  bot._client.on('unload_chunk', (packet) => {
    bot.world.setColumn(packet.chunkX, packet.chunkZ, undefined);
  });

  bot._client.on('block_change', (packet) => {
    //console.log(packet);
    bot.world.setBlockType(new Vec3(packet.location.x, packet.location.y, packet.location.z), packet.type >> 4);
  });

  bot._client.on('map_chunk_bulk', (packet) => {
    // TODO: map_chunk_bulk
  });

  bot._client.on('multi_block_change', (packet) => {
    /*
    multi_block_change {  chunkX: -10,
                          chunkZ: -43,
                          records:
                           [ { horizontalPos: 65, y: 35, blockId: 0 },
                             { horizontalPos: 48, y: 35, blockId: 0 },
                             { horizontalPos: 64, y: 35, blockId: 0 } ] }
    */
  });

  // TODO: entity block update
  bot._client.on('tile_entity_data', (packet) => {
    let be = bot.world.getColumnAt(packet.location).blockEntities;
    if(be) be.push(packet.nbtData);
  });

}

module.exports = inject;
