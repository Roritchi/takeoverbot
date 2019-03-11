const { EventEmitter } = require('events');

function inject(client, bot) {
  client.pluginLoader = new EventEmitter();
  client.plugins = [];

  client.loadPlugin = function(plugin) {
    if(Object.keys(plugin).length === 0) {
      // Module
      client.plugins.push({ type: 'module', plugin: plugin });
      plugin(client, bot);
    } else {
      // Normal plugin
      client.plugins.push({ type: 'plugin', plugin: plugin });
      plugin.init(client, bot);
    }
    client.pluginLoader.emit('init', plugin);
  }

  client.loadPlugins = function(plugins) {
    for(let plugin of plugins) {
      client.loadPlugin(plugin);
    }
  }

  client.on('end', () => {
    //TODO: Unload all Plugins
  });

}

module.exports = inject;
