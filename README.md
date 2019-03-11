# takeoverbot
A Minecraft Bot which you can take over at any time

# Installation

### Prerequisits
- NPM & Node.js
- Install required packages with `npm install`

# Example
```javascript

const { createBot, createProxy } = require('./');

const opts = {
  version: '1.12.2',
  username: 'TKO-Bot', // defaults to "Player" + random
  host: 'localhost' // defaults to localhost
  port: 25565 // defaults to 25565
}

const bot = createBot(opts);

const proxy = createProxy(bot, {
  port: 25564,
  'online-mode': false, // WARNING: Dont use this in production!
  version: opts.version, // Needs to be same version as the bot!
  whitelist: false, // WARNING: Use it! ["username", "username2"]
});

bot.on('end', () => {
  bot.connect(opts); // Auto Reconnect
});

```
