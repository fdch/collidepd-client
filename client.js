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
const PORT         = process.env.PORT || 5011;

// ---------------------------------------------
const fs = require('fs');
const url = require('url');
const osc = require("osc");
const repl = require('repl');
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const server = http.Server(app);
const io = require('socket.io-client');
const ioS = require('socket.io')(server);
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

  if(isUseHTTPs === false) {
      isUseHTTPs = config.isUseHTTPs;
  }

  function serverHandler(request, response) {
      // to make sure we always get valid info from json file
      // even if external codes are overriding it
      config = getValuesFromConfigJson(jsonPath);
      config = getBashParameters(config, BASH_COLORS_HELPER);

      // HTTP_GET handling code goes below
      try {
          var uri, filename;

          try {
              if (!config.dirPath || !config.dirPath.length) {
                  config.dirPath = null;
              }

              uri = url.parse(request.url).pathname;
              filename = path.join(config.dirPath ? resolveURL(config.dirPath) : process.cwd(), uri);
          } catch (e) {
              pushLogs(config, 'url.parse', e);
          }

          filename = (filename || '').toString();

          if (request.method !== 'GET' || uri.indexOf('..') !== -1) {
              try {
                  response.writeHead(401, {
                      'Content-Type': 'text/plain'
                  });
                  response.write('401 Unauthorized: ' + path.join('/', uri) + '\n');
                  response.end();
                  return;
              } catch (e) {
                  pushLogs(config, '!GET or ..', e);
              }
          }

          if(filename.indexOf(resolveURL('/admin/')) !== -1 && config.enableAdmin !== true) {
              try {
                  response.writeHead(401, {
                      'Content-Type': 'text/plain'
                  });
                  response.write('401 Unauthorized: ' + path.join('/', uri) + '\n');
                  response.end();
                  return;
              } catch (e) {
                  pushLogs(config, '!GET or ..', e);
              }
              return;
          }

          var matched = false;
          ['/demos/', '/dev/', '/dist/', '/socket.io/', '/node_modules/canvas-designer/', '/admin/'].forEach(function(item) {
              if (filename.indexOf(resolveURL(item)) !== -1) {
                  matched = true;
              }
          });

          // files from node_modules
          ['RecordRTC.js', 'FileBufferReader.js', 'getStats.js', 'getScreenId.js', 'adapter.js', 'MultiStreamsMixer.js'].forEach(function(item) {
              if (filename.indexOf(resolveURL('/node_modules/')) !== -1 && filename.indexOf(resolveURL(item)) !== -1) {
                  matched = true;
              }
          });

          if (filename.search(/.js|.json/g) !== -1 && !matched) {
              try {
                  response.writeHead(404, {
                      'Content-Type': 'text/plain'
                  });
                  response.write('404 Not Found: ' + path.join('/', uri) + '\n');
                  response.end();
                  return;
              } catch (e) {
                  pushLogs(config, '404 Not Found', e);
              }
          }

          ['Video-Broadcasting', 'Screen-Sharing', 'Switch-Cameras'].forEach(function(fname) {
              try {
                  if (filename.indexOf(fname + '.html') !== -1) {
                      filename = filename.replace(fname + '.html', fname.toLowerCase() + '.html');
                  }
              } catch (e) {
                  pushLogs(config, 'forEach', e);
              }
          });

          var stats;

          try {
              stats = fs.lstatSync(filename);

              if (filename.search(/demos/g) === -1 && filename.search(/admin/g) === -1 && stats.isDirectory() && config.homePage === '/demos/index.html') {
                  if (response.redirect) {
                      response.redirect('/demos/');
                  } else {
                      response.writeHead(301, {
                          'Location': '/demos/'
                      });
                  }
                  response.end();
                  return;
              }
          } catch (e) {
              response.writeHead(404, {
                  'Content-Type': 'text/plain'
              });
              response.write('404 Not Found: ' + path.join('/', uri) + '\n');
              response.end();
              return;
          }

          try {
              if (fs.statSync(filename).isDirectory()) {
                  response.writeHead(404, {
                      'Content-Type': 'text/html'
                  });

                  if (filename.indexOf(resolveURL('/demos/MultiRTC/')) !== -1) {
                      filename = filename.replace(resolveURL('/demos/MultiRTC/'), '');
                      filename += resolveURL('/demos/MultiRTC/index.html');
                  } else if (filename.indexOf(resolveURL('/admin/')) !== -1) {
                      filename = filename.replace(resolveURL('/admin/'), '');
                      filename += resolveURL('/admin/index.html');
                  } else if (filename.indexOf(resolveURL('/demos/dashboard/')) !== -1) {
                      filename = filename.replace(resolveURL('/demos/dashboard/'), '');
                      filename += resolveURL('/demos/dashboard/index.html');
                  } else if (filename.indexOf(resolveURL('/demos/video-conference/')) !== -1) {
                      filename = filename.replace(resolveURL('/demos/video-conference/'), '');
                      filename += resolveURL('/demos/video-conference/index.html');
                  } else if (filename.indexOf(resolveURL('/demos')) !== -1) {
                      filename = filename.replace(resolveURL('/demos/'), '');
                      filename = filename.replace(resolveURL('/demos'), '');
                      filename += resolveURL('/demos/index.html');
                  } else {
                      filename += resolveURL(config.homePage);
                  }
              }
          } catch (e) {
              pushLogs(config, 'statSync.isDirectory', e);
          }

          var contentType = 'text/plain';
          if (filename.toLowerCase().indexOf('.html') !== -1) {
              contentType = 'text/html';
          }
          if (filename.toLowerCase().indexOf('.css') !== -1) {
              contentType = 'text/css';
          }
          if (filename.toLowerCase().indexOf('.png') !== -1) {
              contentType = 'image/png';
          }

          fs.readFile(filename, 'binary', function(err, file) {
              if (err) {
                  response.writeHead(500, {
                      'Content-Type': 'text/plain'
                  });
                  response.write('404 Not Found: ' + path.join('/', uri) + '\n');
                  response.end();
                  return;
              }

              try {
                  file = file.replace('connection.socketURL = \'/\';', 'connection.socketURL = \'' + config.socketURL + '\';');
              } catch (e) {}

              response.writeHead(200, {
                  'Content-Type': contentType
              });
              response.write(file, 'binary');
              response.end();
          });
      } catch (e) {
          pushLogs(config, 'Unexpected', e);

          response.writeHead(404, {
              'Content-Type': 'text/plain'
          });
          response.write('404 Not Found: Unexpected error.\n' + e.message + '\n\n' + e.stack);
          response.end();
      }
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

      httpApp = httpServer.createServer(options, serverHandler);
  } else {
      httpApp = httpServer.createServer(serverHandler);
  }

  RTCMultiConnectionServer.beforeHttpListen(httpApp, config);
  httpApp = httpApp.listen(RTCPORT, RTCSERVER, function() {
      RTCMultiConnectionServer.afterHttpListen(httpApp, config);
  });



  // server.listen(PORT, () => console.log(`Listening on ${ PORT }`));

}
