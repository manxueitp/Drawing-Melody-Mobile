var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3010;

http.listen(port, function(){
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

//number of user
var numUsers=0;
var usersId=[];
var usersPosX=[];
var usersPosY=[];
var userList=[];
var thisUser={};

//-----------------------------socket-----------------------------//
io.on('connection', 
  function (socket) {
    var addedUser = false;
    var userId = socket.id;
     // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
      if (addedUser) return;

      // we store the username in the socket session for this client
      socket.username = username;

      var thisUser = {
        id: socket.id,
        name: socket.username,
        x: Math.floor((Math.random() * 900) + 50),
        y: Math.floor((Math.random() * 500) + 50)
      };
      io.sockets.emit('initialUser', thisUser);

      userList.push(thisUser);
      console.log(thisUser);
      console.log("userList num = "+ userList.length);
      console.log(userList);

      ++numUsers;
      addedUser = true;
      socket.broadcast.emit('login', {
        numUsers: numUsers
      });
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit('user joined', {
        username: socket.username,
        numUsers: numUsers
      });

      io.sockets.emit('updateUserList', userList);
    });

    var userId = socket.id;
    console.log("We have a new client: " + socket.id);
  
    socket.on('addposition',
      function(data) {
        io.sockets.emit('addposition', data);
      }
    );
    
    socket.on('newmover',
      function(data) {
        io.sockets.emit('newmover', data);
  
      }
    );
    socket.on('finishmover',
      function(data) {
        io.sockets.emit('finishmover', data);
        console.log(process.memoryUsage());
      }
    );

    socket.on('othermovers',
      function(data) {
        io.sockets.emit('othermovers', data);
  
      }
    );

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
      if (addedUser) {
        --numUsers;
        
        for (var i = 0; i < userList.length; i++) {
          if (userList[i].id === userId) {
             userList.splice(i,1);
          }
        }

        socket.broadcast.emit('user left', {
          username: socket.username,
          numUsers: numUsers
        });

        io.sockets.emit('disconnect', socket.id);
      }
    });
});


// force garbage collector

try {
  global.gc();
} catch (e) {
  console.log("You must run program with 'node --expose-gc index.js' or 'npm start'");
  process.exit();
}
