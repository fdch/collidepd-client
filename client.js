// ---------------------------------------------

const SERVER  = "https://collidepd.herokuapp.com";
const UDPHOST = "localhost";
const UDPPORT = 5009;

// ---------------------------------------------

const osc = require("osc");
const io = require('socket.io-client');
const repl = require('repl');
const socket = io.connect(SERVER, {
  transports: ['websocket'],
  autoConnect: false
});
const udpPort = new osc.UDPPort({
  remoteAddress: UDPHOST,
  remotePort: UDPPORT,
  metadata: true
});

// ---------------------------------------------

var verbose = 0;

// ---------------------------------------------

function rstrip( str ) { 
  // Removes trailing new line characters from string
  return str.replace( /[\r\n]+/gm, "" ); 
}

function sendUDPMessage(port, data) {
  // Sends a UDP message
  // input: array shaped with '/osc/address f1 [, f2, f3, ...]'
  let address = data.shift();
  let args = Array.prototype.map.call(data, function(x) {
    return {type:'f', value:x};
  });

  port.send({ address: address, args: args });

}

function sendSocketMessage(socket, data) {
  // Sends a message to the socket
  // input: array shaped with 'address, [header, values...]'
  let address = data.shift();

  switch(data.length) {
    case 0:
      socket.emit(address);
    break;
    case 1:
      socket.emit(address, data.toString());
    break;
    default:
      socket.emit(address, {
        header : data.shift(),
        values : data
      });
    break;
  }
}


repl.start({
  
  prompt: '',
  
    eval: (cmd) => {
      // parse the string into a data array
      const data = rstrip(cmd).split(' ');
      // interpret the first element as header
      f = data[0].toString();
      // parse the header and forward messages
      if (!f.localeCompare("connect")) {
        // connect to the socket
        socket.open();
      } else if (!f.localeCompare("disconnect")) {
        // disconnect from the socket
        socket.close();
      } else if (!f.localeCompare("udpconnect")) {
        // connect to the udp port
        udpPort.open();
      } else if (!f.localeCompare("udpdisconnect")) {
        // disconnect from the udp port
        udpPort.close();
      } else if (!f.localeCompare("verbose")) {
        // change verbosity
        verbose = verbose ? 0 : 1;
      } else if (!f.localeCompare("exit")) {
        console.log("Bye!");
        udpPort.close();
        if (socket.connected) socket.close();
        process.exit();
      } else if (!f.localeCompare("server")) {
        // forward the server message to the socket
        s = data.shift();
        sendSocketMessage(socket, data);
      } else {
        // forward the osc formatted message
        sendUDPMessage(udpPort, data);
      }
    }

});

// socket callbacks

socket.on('connect', () => {
  console.log("socket id: " + socket.id);
});

socket.on("connect_error", (error) => {
  console.error(error.message);
});

socket.on("disconnect", (reason) => {
  console.log(reason);
});

socket.on('users', function(data) {
  console.log(data.toString());
});
socket.on('console', function(data) {
  console.log(data);
});
socket.on('chat', function(data) {
  console.log('chat: %j', data);
});
socket.on('event', function(data) {
  
  let args = Array.prototype.map.call([...data[0].value], function(x) {
    return {type:'f', value:x};
  });
  let address ="/"+data[0].id.toString()+data[0].head.toString();
  
  var oscformat = {
    address: address, 
    args: args
  }

  udpPort.send(oscformat);
  
  if (verbose) {
    console.log("data: %j", data);
    console.log("OSC: %j", oscformat);
  }
});
socket.on('control', function(data) {
  console.log(data);
});
socket.on('dump', function(data) {
  console.log(data);
});
socket.on('connected', function() {
  console.log("connected");
});
