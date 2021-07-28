const MAXUSERS     = 1002;
var userData       = new Array(MAXUSERS);
var sintes         = new Array(MAXUSERS);
var initialized    = false;

var s;            // the client's osc id
var num_players;  // the number of connected players
var players;      // the array of connected players

var canvas;
let timeout;

var CHORRO = true;

sintes.fill(0);

const canvasDiv = document.getElementById('canvas');
const chatDiv = document.getElementById('chat');
const playersSpan = document.getElementById('playersSpan');

const socket = io("https://collidepd.herokuapp.com", {
  transports: ['websocket'],
  autoConnect: true
});

timeout = setInterval(function(){
  if (socket.connected) {
    console.log("Socket Connected.");
    // console.log("Socket",socket);
    clearInterval(timeout);
  } else {
    console.log("Waiting for socket...");
  }
}, 1000);

function addChat(data) {
  if( data.value !== "" && data.head >= 0 ) {
    let messages = document.getElementById('messages');
    let topPos = chatDiv.offsetTop;
    let li = document.createElement('span');
    li.innerHTML = data.head + ": " + data.value;
    let d = document.createElement('div');
    d.className = "chat-bubble";
    d.appendChild(li);
    messages.appendChild(d);
    chatDiv.scrollTop = topPos+10;
  }
}
