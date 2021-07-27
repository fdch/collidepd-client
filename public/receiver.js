
// socket.on('loopstart', (data) => {
//     let i = data[0]; // indice del usuario
//     let x = data[1]; // valor
//     sintes[i].loopstart(x);
// });

// socket.on('set', (data) => {
//     let i = data[0]; // indice del usuario
//     let x = data[1];
//     sintes[i].setrandom(x);
// });

socket.on('tilt', (data) => {
    let i = data[0];
    let x = data[1].x;
    let y = data[1].y;
    let z = data[1].z;
    sintes[i].strokeColor(x,y);
    sintes[i].strokeRadius(z);
});

// socket.on('delay', (data) => {
//     let i = data[0]; // indice del usuario
//     let x = data[1]; // valor
//     sintes[i].delaywet(x);
// });

// socket.on('bpm', (data) => {
//     let i = data[0]; // indice del usuario
//     let x = data[1]; // valor
//     sintes[i].bpm(x);
// });

// socket.on('verb', (data) => {
//     let i = data[0];
//     let x = data[1];
//     sintes[i].verbwet(x);
// });

// socket.on('selectF', (data) => {
//     let i = data[0]; // indice del usuario
//     let x = data[1];
//     sintes[i].selectFilter(x);
// });

// socket.on('selectS', (data) => {
//     let i = data[0]; // indice del usuario
//     let x = data[1]; // no cambiar
//     sintes[i].selectSource(x);
// });

socket.on('position', (data) => {
    let i = data[0]; // indice del usuario
    let x = data[1].x;
    let y = data[1].y;
    sintes[i].draw(x,y);
});

// socket.on('disconnected', () => {console.log('disconnected')});
// socket.on('chat', (data) => {console.log( 'chat', data)});
// socket.on('onoff', (data) => {console.log( 'onoff', data)});
// socket.on('loopstart', (data) => {console.log('loopstart',data)});
// socket.on('set', (data) => {console.log('set',data)});
// socket.on('tilt', (data) => {console.log('tilt',data)});
// socket.on('bpm', (data) => {console.log('bpm',data)});
// socket.on('delay', (data) => {console.log('delay',data)});
// socket.on('verb', (data) => {console.log('verb',data)});
// socket.on('selectF', (data) => {console.log('selectF',data)});
// socket.on('selectS', (data) => {console.log('selectS',data)});
// socket.on('position', (data) => {console.log('position',data)});
