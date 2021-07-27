const hmsg = "\n\
------------------------------------------------\n\
| COLLIDEPD commandline client client utility  |\n\
------------------------------------------------\n\n\
> connect : connect to the socket\n\
> disconnect : disconnect from the socket\n\
> udpconnect : connect to the udp port\n\
> udpdisconnect : disconnect from the udp port\n\
> verbose :  change verbosity\n\
> print : prints user data\n\
> exit: safely exits program\n\
> help : displays this help message\n\
> server [msg] : forwards messages to the server\n\
> /osc/address values... : sends osc messages to the udp server\n\n"
// ---------------------------------------------
const args = process.argv.slice(2);
const SERVER = "https://collidepd.herokuapp.com";
const LOCALSERVER = args[0] || 1;
const UDPPORT = 5009;
const UDPLOCALPORT = 5010;
const UDPHOST = "localhost";
// serve the homepage
const osc = require("osc");
const repl = require('repl');
const path = require('path');
const express = require('express');
const app = express();
const io = require('socket.io-client');
let verbose = 0,
  udpportconnected = 0,
  users, thisid, running = true;

function rstrip(str) {
  // Removes trailing new line characters from string
  return str.replace(/[\r\n]+/gm, "");
}

function sendSocketMessage(socket, data) {
  // Sends a message to the socket
  // input: array shaped with 'address, [header, values...]'
  let address = data.shift();

  switch (data.length) {
    case 0:
      socket.emit(address);
      break;
    case 1:
      socket.emit(address, data.toString());
      break;
    default:
      socket.emit(address, {
        header: data.shift(),
        values: data
      });
      break;
  }
}

function sendUDPMessage(udpPort, address, data) {
  console.log('data %j',data);
  let args = [];
  for (let e in data[1]) {
    args.push({type:'f',value:e[1]});
  }
  // Object.entries(data[1]).map( (k,v) => {
  //   console.log('entries %j AND %j',k,v);
  // })
  console.log(args);
  // var oscformat = {
  //   address: "/cpd" + address + data[0].toString(),
  //   args: 
  // }
  // consoles.log('oscformat %j',oscformat);
  // udpPort.send(oscformat);

  // if (udpportconnected) {
  //   // Sends a UDP message
  //   // input: array shaped with '/osc/address f1 [, f2, f3, ...]'
  //   let address = data.shift();
  //   let args = Array.prototype.map.call(data, function (x) {
  //     return {
  //       type: 'f',
  //       value: x
  //     };
  //   });

  //   udpPort.send({
  //     address: address,
  //     args: args
  //   });
  // }
}

// function onoff(oscid, value) {
//   if (udpportconnected) {
//     udpPort.send({
//       address: "/cpd/" + oscid + "/onoff",
//       args: {
//         type: 'i',
//         value: value
//       }
//     });
//   }
// }
// ---------------------------------------------
// homepage

app.use(express.static(path.join(__dirname, 'public')));

// serve the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

if (LOCALSERVER == 1) {

  console.log("Connecting to heroku server...");

  const socket = io.connect(SERVER, {
    transports: ['websocket'],
    autoConnect: true
  });

  const udpPort = new osc.UDPPort({
    remoteAddress: UDPHOST,
    remotePort: UDPPORT,
    localAddress: UDPHOST,
    localPort: UDPLOCALPORT,
    metadata: true
  });

  // Connect to UDP port
  console.log("Connecting to udp port...");
  udpPort.open();
  udpportconnected = 1;

  // socket callbacks

  socket.on('connect', () => {
    thisid = socket.id;
    console.log("Connected to socket!")
    console.log("socket.id: " + thisid);
    console.log(hmsg)
  });
  
  socket.on('userdata', (data) => {
    // this is received whenever there is a new (dis)connection
    users = data.filter( (x) => { return x !== 0 });
    console.log('userdata %j', users);
  });
  
  socket.on('chathist', (data) => {
    data.map( (obj) => {
      if(obj.value!=='') {
        console.log("chat: %j", obj)
      }
    });
  });
  
  socket.on("connect_error", (error) => {console.error(error.message)});
  socket.on("disconnect", (reason) => { console.log(reason)});
  
  socket.on('connected', (data) => {sendUDPMessage(udpPort,'connected', data)});
  socket.on('disconnected', () => {sendUDPMessage(udpPort, 'disconnected', 0)});
  socket.on('chat', (data) => {sendUDPMessage(udpPort, 'chat', data)});
  socket.on('onoff', (data) => {sendUDPMessage(udpPort, 'onoff', data)});
  socket.on('loopstart', (data) => {sendUDPMessage(udpPort,'loopstart',data)});
  socket.on('set', (data) => {sendUDPMessage(udpPort,'set',data)});
  socket.on('tilt', (data) => {sendUDPMessage(udpPort,'tilt',data)});
  socket.on('bpm', (data) => {sendUDPMessage(udpPort,'bpm',data)});
  socket.on('delay', (data) => {sendUDPMessage(udpPort,'delay',data)});
  socket.on('verb', (data) => {sendUDPMessage(udpPort,'verb',data)});
  socket.on('selectF', (data) => {sendUDPMessage(udpPort,'selectF',data)});
  socket.on('selectS', (data) => {sendUDPMessage(udpPort,'selectS',data)});
  socket.on('position', (data) => {sendUDPMessage(udpPort,'position',data)});
  
  // Prompt for user CLI input

  repl.start({

    prompt: '> ',

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
        if (!udpportconnected) {
          udpPort.open();
          udpportconnected = 1;
        }
      } else if (!f.localeCompare("udpdisconnect")) {
        // disconnect from the udp port
        if (udpportconnected) {
          udpPort.close();
          udpportconnected = 0;
        }
      } else if (!f.localeCompare("verbose")) {
        // change verbosity
        verbose = verbose ? 0 : 1;
      } else if (!f.localeCompare("print")) {
        // change verbosity
        console.log("%j", users);
      } else if (!f.localeCompare("exit")) {
        console.log("Bye!\n");
        if (udpportconnected) udpPort.close();
        if (socket.connected) socket.close();
        process.exit();
      } else if (!f.localeCompare("server")) {
        // forward the server message to the socket
        s = data.shift();
        sendSocketMessage(socket, data);
      } else if (!f.localeCompare("help")) {
        // get some help
        console.log(hmsg);
      } else if (!f.localeCompare("")) {
        // do nothing
      } else {
        // forward the osc formatted message
        sendUDPMessage(udpPort, data);
      }
    }

  });
}