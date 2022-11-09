const net = require("net");


const server = net.createServer((connection) => {});

server.listen(6379, "127.0.0.1");
