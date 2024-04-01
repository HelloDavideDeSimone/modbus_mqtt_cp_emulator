const aedes = require('aedes')();
const server = require('http').createServer();
const ws = require('websocket-stream');
const argparse = require('minimist');

const argv = argparse(process.argv.slice(2), {
  alias: {
    p: 'port'
  },
  default: {
    port: 8888
  }
});

const port = argv.port; 

ws.createServer({ server: server }, aedes.handle);

server.listen(port, function () {
  console.log('WebSocket MQTT broker running on ws://localhost:' + port);
});