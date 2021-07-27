// -----------------------------------------------------------------------------
//
// EVENT HANDLING
//
// -----------------------------------------------------------------------------

//
// 1. "connected" message
//

socket.on('connected', function (data) {
  // populate global variables 's' and 'num_players'
  // this user's oscid (from the server)
  s = data[0];
  // the current number of players upon initial connection
  num_players = data[1];
  // display these values on the html interface
  // playerTitle.innerHTML = s.toString();
  playersSpan.innerHTML = num_players.toString();
  // display a 'connected' message on the interface
  // statusTitle.innerHTML = 'ON';
  // startButton.style.backgroundColor = colorFront;
  console.log("Player #" + s + " of " + num_players + " connected.");

});

// -----------------------------------------------------------------------------
//
// UPDATE PLAYERS
//
// -----------------------------------------------------------------------------

function updatePlayers(data) {

  players = data.filter(function (x) {
      return x !== 0;
  });


  for (let i = 0; i < players.length; i++) {

      let idx = players[i].oscid;

      // console.log(idx);

      if (sintes[idx] === 0) {
          sintes[idx] = new Visualizer(data[i]);
      } else {
          console.log("Player " + idx + " is already ON.");
      }
  }


  num_players = players.length;

  playersSpan.innerHTML = num_players.toString();

}

//
// 2. "userdata" message
//

socket.on('userdata', function (data) {
  // console.log(data);
  updatePlayers(data);
  userData = data;
});

socket.on('removeuser', function (idx) {
  console.log("Disconnecting: " + idx);
  if (sintes[idx] != 0 && typeof sintes[idx].destroyer() !== 'undefined5') {
      // sintes[idx].destroyer();
      sintes[idx] = 0;
  } else {
      console.log("Player " + idx + " is already OFF.");
  }
});

//Socket.on recibe los mensajes desde el servidor
socket.on('chat', (data) => {
  addChat(data);
});
socket.on('chathist', (data) => {
  for (let d of data) {
      addChat(d);
  }
});
