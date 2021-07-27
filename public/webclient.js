var canvas, socket;

function setup() {

  console.log("Making canvas.");

  canvas = createCanvas(windowWidth, windowHeight);

  // frameRate(30);

  socket = io({
    transports: ['websocket'],
    autoConnect: true
  });


  if (socket.connected) {
    console.log("Connected to socket.");
  }

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

}

function draw() {

  // fetchMostRecentData();
}
