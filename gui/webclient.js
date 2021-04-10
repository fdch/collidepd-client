const userAgent = window.navigator.userAgent;
const MAXCHATS = 10;
var deviceIsAndroid;
var canvas, socket, status;
var i, a;
var sx,sy,angle,radius,click;
var playersTitle = document.getElementById('players');
var statusTitle = document.getElementById('status');
var messages = document.getElementById('messages');
var chatbox = document.getElementById('chatbox');
var chat = document.getElementById('chat');

function addChat(e) {
  if (messages.firstChild) 
        messages.removeChild(messages.firstChild);
  let li = document.createElement('li');
  let liapp = messages.appendChild(li);
  liapp.innerHTML = e;
}

function setup() {

  canvas = createCanvas(windowWidth, windowHeight);
  frameRate(30);

  socket = io({
    transports: ['websocket'],
    autoConnect: true
  });

  chatbox.addEventListener("submit", function(evt) {
    evt.preventDefault();
    
      console.log('chat', chat.value);
      addChat(chat.value);
      chat.value = '';

  });

  for (i=0;i<MAXCHATS;i++) {
    let li = document.createElement('li');
    let liapp = messages.appendChild(li);
    liapp.innerHTML = '.';
  }
}

function fetchMostRecentData() {
  fetch("/req")
    .then(response => response.json())
    .then(data => updateView(data))
    .catch(err => showError(err));
}

function updateView(data) {
  let container = document.getElementById("players");

  container.innerHTML = `${data.name} ${data.value}`;
}

function showError(err) {
  console.error(err);
  alert("Something went wrong");
}

function draw() {

  // fetchMostRecentData();
}
