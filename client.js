const hmsg="\n\
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
const SERVER       = "https://collidepd.herokuapp.com";
const RTCSERVER    = "https://collidepd-client.herokuapp.com";
const LOCALSERVER  = args[0] || 1;
const UDPPORT      = 5009;
const UDPLOCALPORT = 5010;
const UDPHOST      = "localhost";

// ---------------------------------------------
const fs = require('fs');
const url = require('url');
const osc = require("osc");
const repl = require('repl');
const express = require('express');
const app = express();
const path = require('path');
const io = require('socket.io-client');
const ioServer = require('socket.io');
const RTCMultiConnectionServer = require('rtcmulticonnection-server');
var verbose = 0, udpportconnected = 0, users, thisid, running=true;
console.log("LOCALSERVER: "+LOCALSERVER);
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

function onoff(oscid, value) {
  if(udpportconnected) {
    udpPort.send({
      address: "/cpd/"+oscid+"/onoff", 
      args: {type:'i', value:value}
    });
  }
}


if (LOCALSERVER==1) {

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

  socket.on('users', (data) => {
    console.log("%d connected users.", data);
  })

  socket.on('usernames', (data) => {
    console.log("%j", data);  
  })

  // socket.on('connected', (data) => {
  //   onoff(data.toString(), 1); // turn user on
  // })

  // socket.on('disconnected', (data) => {
  //   onoff(data.toString(), 0); // turn user off
  // })

  socket.on('onoff', (data, value) => {
    // console.log(data);
    // console.log(value);
    onoff(data.toString(), value); // turn user off
  })

  socket.on('userdata', (data) => {
    // this is received whenever there is a new (dis)connection
    running = false;
    users = data;
    running = true;
    for(let i in users) {
      if (verbose){
        let o = JSON.stringify(users[i], null, 4);
        console.log(o);  
      }
      console.log(users[i]['id'], users[i]['oscid']);
    }
  });


  socket.on('event', (data) => {
    let dropped;
    if (udpportconnected) {
      
      if (running) {
        
        dropped=0;    
      
        let args = Array.prototype.map.call([...data.value], function(x) {
          return {type:'f', value:x};
        });
        
        let address = "/cpd/" + data.id.toString() + data.head.toString();
      
        var oscformat = {
          address: address, 
          args: args
        }
      
        udpPort.send(oscformat);
      
      } else {
      
        dropped++;
      
      }
    }

    if (verbose) {
      console.log("data: %j", data);
      if(udpportconnected) {
        console.log("OSC: %j", oscformat);
        if(dropped) {
          console.log("Dropped %d", dropped);
        }
      }
    }
  });

  socket.on("connect_error", (error) => {
    console.error(error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log(reason);
  });

  socket.on('chat', (data) => {
    console.log('chat: %j', data);
  });
  socket.on('connected', function(s) {
      console.log(s.toString());
  });
  socket.on('disconnected', function() {
      console.log('disconnected');
  });

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
          if(!udpportconnected)  {
            udpPort.open();
            udpportconnected = 1;
          }
        } else if (!f.localeCompare("udpdisconnect")) {
          // disconnect from the udp port
          if(udpportconnected) {
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
} else {

  // ---------------------------------------------

  // homepage

  app.use(express.static(path.join(__dirname, 'gui')));

  // serve the homepage
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

  var PORT = 5011;
  var isUseHTTPs = true;

  const jsonPath = {
      config: 'config.json',
      logs: 'logs.json'
  };

  const BASH_COLORS_HELPER = RTCMultiConnectionServer.BASH_COLORS_HELPER;
  const getValuesFromConfigJson = RTCMultiConnectionServer.getValuesFromConfigJson;
  const getBashParameters = RTCMultiConnectionServer.getBashParameters;
  const resolveURL = RTCMultiConnectionServer.resolveURL;

  var config = getValuesFromConfigJson(jsonPath);
  config = getBashParameters(config, BASH_COLORS_HELPER);

  RTCPORT = config.port;

  if(PORT === 5011) {
    PORT = config.port;
  }

  if(isUseHTTPs === false) {
      isUseHTTPs = config.isUseHTTPs;
  }

  var httpApp;

  if (isUseHTTPs) {
      httpServer = require('https');

      // See how to use a valid certificate:
      // https://github.com/muaz-khan/WebRTC-Experiment/issues/62
      var options = {
          key: null,
          cert: null,
          ca: null
      };

      var pfx = false;

      if (!fs.existsSync(config.sslKey)) {
          console.log(BASH_COLORS_HELPER.getRedFG(), 'sslKey:\t ' + config.sslKey + ' does not exist.');
      } else {
          pfx = config.sslKey.indexOf('.pfx') !== -1;
          options.key = fs.readFileSync(config.sslKey);
      }

      if (!fs.existsSync(config.sslCert)) {
          console.log(BASH_COLORS_HELPER.getRedFG(), 'sslCert:\t ' + config.sslCert + ' does not exist.');
      } else {
          options.cert = fs.readFileSync(config.sslCert);
      }

      if (config.sslCabundle) {
          if (!fs.existsSync(config.sslCabundle)) {
              console.log(BASH_COLORS_HELPER.getRedFG(), 'sslCabundle:\t ' + config.sslCabundle + ' does not exist.');
          }

          options.ca = fs.readFileSync(config.sslCabundle);
      }

      if (pfx === true) {
          options = {
              pfx: sslKey
          };
      }
      httpApp = httpServer.createServer(options);
  } else {
      httpApp = httpServer.createServer();
  }

  
  RTCMultiConnectionServer.beforeHttpListen(httpApp, config);

  httpApp = httpApp.listen(process.env.PORT || PORT, process.env.IP || "0.0.0.0", function() {
      RTCMultiConnectionServer.afterHttpListen(httpApp, config);
  });

  ioServer(httpApp).on('connection', function(socket) {
      RTCMultiConnectionServer.addSocket(socket, config);
  });


}
