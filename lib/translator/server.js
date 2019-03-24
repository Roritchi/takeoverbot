const fs = require('fs');
const { Vec3 } = require('vec3');

module.exports = inject;

function inject(proxy, bot) {

  const Chunk = require('prismarine-chunk')(bot.majorVersion);

  proxy.bot = bot;
  proxy.on('login', (client) => {
    if(bot.initialized && bot.entity) {
      for(let ck of Object.keys(proxy.clients)) {
        if(ck !== client.id) {
          ck.end('Logged on from another location! - Proxy');
        }
      }
      if(proxy.whitelist && !proxy.whitelist.includes(client.username.toLowerCase())) {
        client.end('You are not whitelisted on this Proxy! - Proxy');
        return;
      }
      bot.emit('stop_plugins', client);

      client.write('login', {
        entityId: bot.entity.id,
        levelType: bot.game.levelType,
        gameMode: bot.game.gameMode,
        dimension: bot.game.dimension,
        difficulty: bot.game.difficulty,
        maxPlayers: bot.game.maxPlayers,
        reducedDebugInfo: false
      });
      client.write('position', {
        x: bot.entity.position.x,
        y: bot.entity.position.y,
        z: bot.entity.position.z,
        yaw: bot.entity.yaw,
        pitch: bot.entity.pitch,
        flags: 0
      });

      //Send Player Infos
      client.write('player_info', {
        action: 0,
        data: Object.keys(bot.players).map((name) => {
          return {
            UUID: bot.players[name].uuid,
            name: name,
            properties: [],
            gamemode: 0,
            ping: 0,
            displayName: undefined
          }
        })
      });

      //TODO: Send Entities (including Players)
      for(let entity of bot.entityIter()) {
        if(entity.type === 'player') {
          if(entity.uuid == null) continue;
          const info = {
            action: 0,
            data: [{
              UUID: entity.uuid,
              name: entity.username,
              properties: [],
              gamemode: 0,
              ping: 0
            }]
          }
          client.write('player_info', info);
          client.write('named_entity_spawn', {
            entityId: entity.id,
            playerUUID: entity.uuid,
            data: entity.dataBlobs,
            x: entity.position.x,
            y: entity.position.y,
            z: entity.position.z,
            yaw: entity.yaw,
            pitch: entity.pitch,
            metadata: entity.rawMetadata
          });
        } else if(entity.type === 'object' || entity.type === 'other') {
          client.write('spawn_entity', {
            entityId: entity.id,
            objectUUID: entity.uuid,
            type: entity.entityType,
            x: entity.position.x,
            y: entity.position.y,
            z: entity.position.z,
            yaw: entity.yaw,
            pitch: entity.pitch,
            velocityX: entity.velocity.x,
            velocityY: entity.velocity.y,
            velocityZ: entity.velocity.z,
            intField: entity.intField
          });
        } else if(entity.type === 'orb') {
          client.write('spawn_entity_experience_orb', {
            entityId: entity.id,
            x: entity.position.x,
            y: entity.position.y,
            z: entity.position.z,
            count: entity.count
          });
        } else if(entity.type === 'mob') {
          client.write('spawn_entity_living', {
            entityId: entity.id,
            entityUUID: entity.uuid,
            type: entity.entityType,
            x: entity.position.x,
            y: entity.position.y,
            z: entity.position.z,
            yaw: entity.yaw,
            pitch: entity.pitch,
            headPitch: entity.headPitch,
            velocityX: entity.velocity.x,
            velocityY: entity.velocity.y,
            velocityZ: entity.velocity.z,
            metadata: entity.rawMetadata
          });
        } else if(entity.type === 'painting') {
          client.write('spawn_entity_painting', {
            entityId: entity.id,
            entityUUID: entity.uuid,
            title: entity.title,
            location: entity.position,
            direction: entity.direction
          });
        }

      }

      // Ride Entity
      if(bot.vehicle) {
        client.write('position', {
          x: bot.vehicle.position.x,
          y: bot.vehicle.position.y,
          z: bot.vehicle.position.z,
          yaw: bot.entity.yaw,
          pitch: bot.entity.pitch,
          flags: 0
        });
        client.write('set_passengers', {
          entityId: bot.vehicle.id,
          passengers: [ bot.entity.id ]
        });
      }

      // Inventory
      client.write('window_items', {
        windowId: 0,
        items: bot.inventory.slots.map((item) => {
          if(item === null) {
            if(bot.majorVersion === '1.13') {
              return { present: false }
            } else {
              return { blockId: -1 }
            }
          }
          return {
            blockId: item.type,
            itemCount: item.count,
            itemDamage: item.metadata,
            nbtData: item.nbt || undefined
          }

        })
      });

      // Playerlist Header/Footer
      client.write('playerlist_header', {
        header: bot.game.header,
        footer: bot.game.footer
      });

      // Rain
      if(bot.game.raining) client.write('game_state_change', { reason: 2, value: 0 });

      (async() => {
        for(let chunk of bot.world.getColumns()) {
          if(!chunk.column) continue;
          if(bot.game.dimension === 0)
            client.write('map_chunk', { x: chunk.chunkX, z: chunk.chunkZ, chunkData: chunk.column.dump(), blockEntities: chunk.column.blockEntities, bitMap: chunk.column.bitMap, groundUp: chunk.column.groundUp });
          else { // Chunk Dump is kinda buggy for the Nether and the End
            client.write('map_chunk', { x: chunk.chunkX, z: chunk.chunkZ, chunkData: chunk.column.raw, blockEntities: chunk.column.blockEntities, bitMap: chunk.column.bitMap, groundUp: chunk.column.groundUp });

            let c = new Chunk();
            c.load(chunk.column.raw, chunk.column.bitMap, false);
            c.bitMap = chunk.column.bitMap;
            c.groundUp = chunk.column.groundUp;
            c.blockEntities = chunk.column.blockEntities;
            for(let x = 0; x < 16; x++) {
              for(let y = 0; y < 256; y++) {
                for(let z = 0; z < 16; z++) {
                  if(c.getBlockType(new Vec3(x, y, z)) != chunk.column.getBlockType(new Vec3(x, y, z))) {
                    client.write('block_change', {
                      type: chunk.column.getBlockType(new Vec3(x, y, z)) << 4,
                      location: {
                        x: chunk.chunkX * 16 + x,
                        y: y,
                        z: chunk.chunkZ * 16 + z
                      }
                    });
                  }
                }
              }
            }


          }
        }
      })();

      client.on('packet', onClientPacket);
      bot._client.on('packet', onBotPacket);

      function onBotPacket(packet, meta) {
        //console.log(meta.name, packet);
        if(meta.name === 'keep_alive') return;
        client.write(meta.name, packet);
      }

      function onClientPacket(packet, meta) {
        //console.log(meta.name, packet);
        if(meta.name === 'keep_alive') return;
        bot._client.write(meta.name, packet);
      }

      client.on('end', () => {
        bot._client.removeListener('packet', onBotPacket);
        client.removeListener('packet', onClientPacket);
        bot.emit('start_plugins');
      });

      require('./plugin_loader')(client, bot);

      fs.readdirSync(__dirname + '/modules').forEach(file => {
        client.loadPlugin(require(__dirname + '/modules/' + file));
      });

      proxy.emit('child', client);

    } else {
      client.end('Bot not initialized');
    }
  });

}
