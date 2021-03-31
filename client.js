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

const SERVER  = "https://collidepd.herokuapp.com";
const UDPHOST = "localhost";
const UDPPORT = parseInt(process.argv[2] || 5009);
const AUTOCONNECT = true;
const UDPLOCALPORT = parseInt(process.argv[3] || UDPPORT + 1);

// ---------------------------------------------

const osc = require("osc");
const io = require('socket.io-client');
const repl = require('repl');

console.log("Connecting to heroku server...");

const socket = io.connect(SERVER, {
  transports: ['websocket'],
  autoConnect: AUTOCONNECT
});
const udpPort = new osc.UDPPort({
  remoteAddress: UDPHOST,
  remotePort: UDPPORT,  
  localAddress: UDPHOST,
  localPort: UDPLOCALPORT,
  metadata: true
});

// ---------------------------------------------

var verbose = 0, udpportconnected = 0, users, thisid, running=true;

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


function addUserOscId(uid) {
  // adds the user to the internal users array
  // and return its osc id
  let u = {}, oscid = users.length + 1;
  u[uid] = oscid;
  users.push(u);

  return oscid;
}

function getUserOscId(uid) {
  // returns our internal osc id of the requested user id (socket.id)
  let u = users[0];
  for (let i in u) {
    if (!uid.localeCompare(u[i].id.toString())) {
      return u[i].oscid.toString();
    }
  }
}

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


socket.on('killuser', (data) => {
  if(udpportconnected) {
    udpPort.send({
      address: "/cpd/"+data.toString()+"/kill", 
      args: {type:'f', value:0}
    });
  }
})

socket.on('userdata', (data) => {
  // this is received whenever there is a new (dis)connection
  running = false;
  users = data;
  running = true;
  for(let i in users) {
    console.log("data[%d]=%j",i,users[i]);
  }
});


socket.on('event', (data) => {
  let dropped;
  if (udpportconnected) {
    
    if (running) {
      
      dropped=0;    
    
      let uid = data[0].id.toString();
      let args = Array.prototype.map.call([...data[0].value], function(x) {
        return {type:'f', value:x};
      });
      // osc message formatted as: "/cpd/OSCID/HEAD/ VALUES..."
      let oscid = "-1";
      try {
        oscid = getUserOscId(uid);
      } catch (error) {
        // console.error(error);
      }
      let address ="/cpd/"+oscid+data[0].head.toString();
    
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


// Connect to UDP port

if (AUTOCONNECT) {
  console.log("Connecting to udp port...");
  udpPort.open();
}

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
