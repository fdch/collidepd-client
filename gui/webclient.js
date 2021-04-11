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

var connection = new RTCMultiConnection();

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

  socket.on('address', data => {
    console.log(data);
    connection.socketURL = data;

    // ......................................................
    // ..................RTCMultiConnection Code.............
    // ......................................................

    // by default, socket.io server is assumed to be deployed on your own URL
    // connection.socketURL = "https://localhost:22941/";
    // comment-out below line if you do not have your own socket.io server
    // connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

    connection.socketMessageEvent = 'audio-conference-demo';

    connection.session = {
        audio: true,
        video: false
    };

    connection.mediaConstraints = {
        audio: true,
        video: false
    };

    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: false
    };

    // https://www.rtcmulticonnection.org/docs/iceServers/
    // use your own TURN-server here!
    connection.iceServers = [{
        'urls': [
            'https://fdch-stun.herokuapp.com',
        ]
    }];

    connection.audiosContainer = document.getElementById('audios-container');

    connection.onstream = function(event) {
        var width = parseInt(connection.audiosContainer.clientWidth / 2) - 20;
        var mediaElement = getHTMLMediaElement(event.mediaElement, {
            title: event.userid,
            buttons: ['full-screen'],
            width: width,
            showOnMouseEnter: false
        });

        connection.audiosContainer.appendChild(mediaElement);

        setTimeout(function() {
            mediaElement.media.play();
        }, 5000);

        mediaElement.id = event.streamid;
    };

    connection.onstreamended = function(event) {
        var mediaElement = document.getElementById(event.streamid);
        if (mediaElement) {
            mediaElement.parentNode.removeChild(mediaElement);
        }
    };

    function disableInputButtons() {
        document.getElementById('open-or-join-room').disabled = true;
        document.getElementById('open-room').disabled = true;
        document.getElementById('join-room').disabled = true;
        document.getElementById('room-id').disabled = true;
    }

    // ......................................................
    // ......................Handling Room-ID................
    // ......................................................

    function showRoomURL(roomid) {
        var roomHashURL = '#' + roomid;
        var roomQueryStringURL = '?roomid=' + roomid;

        var html = '<h2>Unique URL for your room:</h2><br>';

        html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
        html += '<br>';
        html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';

        var roomURLsDiv = document.getElementById('room-urls');
        roomURLsDiv.innerHTML = html;

        roomURLsDiv.style.display = 'block';
    }

    (function() {
        var params = {},
            r = /([^&=]+)=?([^&]*)/g;

        function d(s) {
            return decodeURIComponent(s.replace(/\+/g, ' '));
        }
        var match, search = window.location.search;
        while (match = r.exec(search.substring(1)))
            params[d(match[1])] = d(match[2]);
        window.params = params;
    })();

    var roomid = '';
    if (localStorage.getItem(connection.socketMessageEvent)) {
        roomid = localStorage.getItem(connection.socketMessageEvent);
    } else {
        roomid = connection.token();
    }
    document.getElementById('room-id').value = roomid;
    document.getElementById('room-id').onkeyup = function() {
        localStorage.setItem(connection.socketMessageEvent, this.value);
    };

    var hashString = location.hash.replace('#', '');
    if (hashString.length && hashString.indexOf('comment-') == 0) {
        hashString = '';
    }

    var roomid = params.roomid;
    if (!roomid && hashString.length) {
        roomid = hashString;
    }

    if (roomid && roomid.length) {
        document.getElementById('room-id').value = roomid;
        localStorage.setItem(connection.socketMessageEvent, roomid);

        // auto-join-room
        (function reCheckRoomPresence() {
            connection.checkPresence(roomid, function(isRoomExist) {
                if (isRoomExist) {
                    connection.join(roomid);
                    return;
                }

                setTimeout(reCheckRoomPresence, 5000);
            });
        })();

        disableInputButtons();
    }
  });

}

function draw() {

  // fetchMostRecentData();
}
