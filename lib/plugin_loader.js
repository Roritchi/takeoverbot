const { EventEmitter } = require('events');

function inject(bot) {
  bot.pluginLoader = new EventEmitter();
  bot.plugins = [];

  bot.loadPlugin = function(plugin) {
    if(Object.keys(plugin).length === 0) {
      // Module
      bot.plugins.push({ type: 'module', plugin: plugin });
      plugin(bot);
    } else {
      // Normal plugin
      bot.plugins.push({ type: 'plugin', plugin: plugin, active: false });
      plugin.init(bot);
    }
    bot.pluginLoader.emit('init', plugin);
  }

  bot.loadPlugins = function(plugins) {
    for(let plugin of plugins) {
      bot.loadPlugin(plugin);
    }
  }

  bot.on('start_plugins', () => {
    for(let plugin of bot.plugins) {
      if(plugin.type === 'plugin') {
        if(!plugin.active) {
          plugin.active = true;
          plugin.plugin.start(bot);
        }
      }
    }
  });

  bot.on('stop_plugins', () => {
    for(let plugin of bot.plugins) {
      if(plugin.type === 'plugin') {
        if(plugin.active) {
          plugin.active = false;
          plugin.plugin.stop(bot);
        }
      }
    }
  });

}

module.exports = inject;
