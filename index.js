'use strict'

const mc = require('minecraft-protocol');
const EventEmitter = require('events').EventEmitter;
const pluginLoader = require('./lib/plugin_loader');
const modules = {
  world: require('./lib/modules/world'),
  game: require('./lib/modules/game'),
  entities: require('./lib/modules/entities'),
  experience: require('./lib/modules/experience'),
  inventory: require('./lib/modules/inventory'),
};
const plugins = {
  respawn: require('./lib/plugins/respawn'),
  afk: require('./lib/plugins/afk'),
  physics: require('./lib/plugins/physics'),
}
const supportedVersions = require('./lib/version').supportedVersions;

function createBot(options = {}) {
  options.username = options.username || 'Player' + Math.random().toString().slice(-4, -1);
  options.version = options.version || '1.12.2';
  options.plugins = options.plugins || {};
  options.modules = options.modules || {};
  options.loadInternalModules = options.loadInternalModules !== false;
  options.loadInternalPlugins = options.loadInternalPlugins !== false;

  const bot = new Bot();

  bot.connect(options);

  return bot;
}

function createProxy(bot, options = {}) {
  options.motd = options.motd || 'A TKO Proxy';
  options.port = options.port || 25565;
  options.version = options.version || '1.12.2';
  options.beforePing = options.beforePing || ((response, client) => { return response; });
  options['max-players'] = 1;
  if(options.whitelist == null)
    options.whitelist = [];

  const proxy = mc.createServer(options);
  proxy.whitelist = options.whitelist;

  require('./lib/translator/server')(proxy, bot);

  return proxy;
}

class Bot extends EventEmitter {

  constructor() {
    super();
    this._client = null;
  }

  connect(options) {
    const self = this;

    options.plugins = options.plugins || {};
    options.modules = options.modules || {};
    options.loadInternalModules = options.loadInternalModules !== false;
    options.loadInternalPlugins = options.loadInternalPlugins !== false;

    self._client = mc.createClient({
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      version: options.version
    });
    self.username = self._client.username;
    self._client.on('session', () => {
      self.username = self._client.username;
      self.emit('session', self.username);
    });
    self._client.on('connect', () => {
      self.emit('connect');
    });
    self._client.on('error', (err) => {
      self.emit('error', err);
    });
    self._client.on('end', () => {
      self.emit('stop_plugins');
      self.emit('end');
    });
    if (!self._client.wait_connect) next();
    else self._client.once('connect_allowed', next);
    function next () {
      const version = require('minecraft-data')(self._client.version).version;
      if (supportedVersions.indexOf(version.majorVersion) === -1) {
        throw new Error(`Version ${version.minecraftVersion} is not supported.`);
      }
      self.protocolVersion = version.version;
      self.majorVersion = version.majorVersion;
      self.version = version.minecraftVersion;
      options.version = version.minecraftVersion;
      self.emit('inject_allowed');
    }

    pluginLoader(self);

    const internalModules = Object.keys(modules).filter(key => {
      if (typeof options.modules[key] === 'function') return;
      if (options.modules[key] === false) return;
      return options.modules[key] || options.loadInternalModules;
    }).map(key => modules[key]);
    const internalPlugins = Object.keys(plugins).filter(key => {
      if (typeof options.plugins[key] === 'function') return;
      if (options.plugins[key] === false) return;
      return options.plugins[key] || options.loadInternalPlugins;
    }).map(key => plugins[key]);
    self.loadPlugins([ ...internalModules, ...internalPlugins ]);
    self._client.once('position', (packet) => {
      self.emit('start_plugins');
      self.initialized = true;
    });

  }

  end() {
    this._client.end();
  }

}

module.exports = {
  Bot,
  createBot,
  createProxy,
  supportedVersions
};
