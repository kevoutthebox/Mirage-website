(function() {

    var vendorUrl = window.URL || window.webkitURL;
    let peer;
    let chattersClient = [];
    let chatterThisClient;

    navigator.getMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

    navigator.getMedia({
        video: true,
        audio: false
    }, function(stream) {
        const socket = io();

        // var initialClient = false;
        console.log(stream);
        // socket.emit('initiator?', JSON.stringify(stream.id));
        socket.on('initiated', (chatter) => {

          if (chattersClient.filter(clientChatter => clientChatter.id !== chatter.id).length || !chattersClient.length) {
            chattersClient.push(chatter);
            chatterThisClient = chatter.id;
          }
          if (chatter.initiator) {
            console.log('i am initiated 1');
            peer = new SimplePeer({
              initiator: true,
              trickle: false,
              stream: stream
            });
          } else {
            console.log('i am initiator 2');
              peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream: stream
              })
            }

            peer.on('signal', function(data) {
              document.getElementById('yourId').value = JSON.stringify(data);
              // if (window.location.href.match(/#init/)){
              //   initialClient = true;
              // }
              if (peer.initiator) {
                socket.emit('initial', JSON.stringify(data));
              } else if (!peer.initiator) {
                socket.emit('third', JSON.stringify(data));
              }
            });

            peer.on('data', function(data) {
              document.getElementById('messages').textContent += data + '\n';
            });

            document.getElementById('connect').addEventListener('click', function() {
              if (!peer.initiator) {
                socket.emit('second');
              }
            });

            socket.on('initialConnected', function(){
              console.log('initialConnected', peer.initiator)
              if (!peer.initiator){
                console.log('Initial connected good');
              }
            });

            socket.on('secondPart2', (initialClientId) => {
              if (!peer.initiator){
                peer.signal(initialClientId);
              }
            });

            socket.on('thirdPart2', function(secondClientId){
              if (peer.initiator){
                peer.signal(secondClientId);
              }
            });

            socket.on('updateChatters', (chatter) => {
              chattersClient.splice(chattersClient.indexOf(chatter), 1);
            });

            document.getElementById('send').addEventListener('click', function() {
              // var yourMessage = document.getElementById('yourMessage').value;
              // peer.send(yourMessage);
              peer.initiator = true
              console.log(peer)
            })

            peer.on('stream', function(stream) {
              var video = document.createElement('video');
              video.setAttribute('id', 'video');
              document.getElementById('booth').appendChild(video);

              var newCanvas = document.createElement('canvas');
              newCanvas.setAttribute('id', 'canvas');
              document.getElementById('booth').appendChild(newCanvas);

              video.src = vendorUrl.createObjectURL(stream);
              video.play();

              var canvas = document.getElementById('canvas'),
              context = canvas.getContext('2d'),
              video = document.getElementById('video');

              video.addEventListener('play', function() {
                draw(this, context, 400, 300);
              }, false);
            });
          });

    }, function(err) {
        console.error(err);
    })


    function draw(video, context, width, height) {
        // console.log ('canvas: ' + canvas, 'context: ' + context);
        var image, data, i, r, g, b, brightness;

        context.drawImage(video, 0, 0, width, height);

        image = context.getImageData(0, 0, width, height);
        data = image.data;

        for (i = 0; i < data.length; i = i + 4) {
            r = data[i];
            g = data[i + 1];
            b = data[i + 2];
            brightness = (r + b + g) / 3;

            data[i] = data[i + 1] = data[i + 2] = brightness;
        }

        image.data = data;

        context.putImageData(image, 0, 0);

        setTimeout(draw, 10, video, context, width, height);
    }

})();
