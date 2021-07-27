const express  = require('express');
const app      = express();
const path     = require('path');
const http     = require('http');
const server   = http.Server(app);
const PORT     = process.env.PORT || 80;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
server.listen(PORT, () => console.log(`Listening on ${ PORT }`));