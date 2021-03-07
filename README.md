# CollidePD Client

CLI (command line interface) client for the `collidepd` server: https://github.com/fdch/collidepd

## Install

### 1. Get Node.js and npm
This project is made using `node.js` and `npm`. You can get `npm` here: https://www.npmjs.com/get-npm

### 2. Get the repository and install dependencies
```
git clone https://github.com/fdch/collidepd-client.git
cd collidepd-client
npm install express --save
npm install socket.io-client --save
```

## Usage

Inside the `collidepd-client` directory, you can now run the client script like this: `node client.js`

### Messages:

- `connect`  connects to the websocket host (see inside `client.js` for more).
- `disconnect` disconnects from the websocket host.
- `udpconnect` connects to localhost at port `5009` for UDP messages.
- `udpdisconnect` disconnect from localhost.
- `verbose` toggle console printing on or off
- `exit` closes any connection and quits

### Special Messages:

#### `server` - interface to the websocket server

Any message prepended with `server` will be forwarded to the server.

- `server name myname` will change your client name on the server
- `server users` returns how many users are connected and their ids or names
- `server chat "hello there, I'm chatting"` sends out a chat message
- `server event /dog 1 2 3` sends out an 'event' message in osc format 
- `server mode 1|0` changes broadcast mode to include sender or not.
- `server verbose 1|0` changes verbosity on the server for console output.
- `server dump` outputs all server-side stored data to the sender.

## Example
Test pd-server printing osc to terminal stout. This script opens a pd patch that listens to UDP port 5009 and prints incoming osc-parsed messages to console. 
```
./start-pd-server
```
On a different terminal, start the client script and connect to websocket:
```
node client.js
[prompt:] connect
socket id: QXOnsbgCzj8mB_0GAAAC
connected
1
```
Then, you can send a chat:
```
[prompt:] server chat "hello world"
```
Check for anything that is stored on the server:
```
[prompt:] server dump
[
  {
    id: 'QXOnsbgCzj8mB_0GAAAC',
    data: { name: '', event: [], control: [], chat: [Array] },
    time: 1615075506104
  }
]
```
You can also connect to the udp port and send a message, and wait for the output on the terminal window running the pd script.
```
[prompt:] udpconnect
[prompt:] server event /cat 4 5 6

```

When you are done, you can exit like this:
```
[prompt:] exit
Bye!
io client disconnect
```




