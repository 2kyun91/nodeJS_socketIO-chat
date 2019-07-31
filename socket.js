// ws 패키지는 간단하게 웹 소켓을 사용하고자 할 때 좋다. 구현하고자 하는 서비스가 복잡한 경우에는 Socket.IO를 사용하는 것이 편하다.
const SocketIO = require('socket.io');
const axios = require('axios');

module.exports = (server, app, sessionMiddleware) => {
    // socket.io 패키지를 불러와서 익스프레스 서버와 연결한다.
    // 두번째 인자로 옵션 객체를 넣어 서버에 관한 여러 가지 설정을 할 수 있다.
    const io = SocketIO(server, {path : '/socket.io'});

    app.set('io', io); // 라우터에서 io 객체를 쓸 수 있게 저장한다. req.app.get('io')로 접근 가능하다.

    const room = io.of('/room'); // of() 메소드로 네임스페이스를 지정할 수 있다.
    const chat = io.of('/chat');
    // app.js에서 express-session 미들웨어를 공유하기 위해 변수로 분리하였기 때문에 io.use 메소드에 미들웨어를 장착할 수 있다.
    // 이 부분은 모든 웹 소켓 연결시 실행된다.
    // 요청객체, 응답객체, next 함수를 인자로 넣어주면 된다.
    io.use((socket, next) => {
        sessionMiddleware(socket.request, socket.request.res, next);
    });

    room.on('connection', (socket) => {
        console.log('room 네임스페이스에 접속');
        socket.on('disconnect', () => {
            console.log('room 네임스페이스 접속 해제');
        });
    });

    chat.on('connection', (socket) => {
        console.log('chat 네임스페이스에 접속');
        // socket.request.headers.referer를 통해 현재 페이지의 URL을 가져올 수 있고 URL에서 방 아이디를 추출한다.
        const req = socket.request;
        const {headers : {referer}} = req;
        const roomId = referer.split('/')[referer.split('/').length -1].replace(/\?.+/, '');

        socket.join(roomId); // roomId번 채팅방에 들어간다.
        
        // socket.to 메소드로 특정 방에 데이터를 보낼 수 있다.
        console.log(222);
        console.log(req.session.color);
        socket.to(roomId).emit('join', {
            user : 'system',
            chat : `${req.session.color}님이 입장하였습니다.`,
        });
        socket.on('disconnect', () => {
            console.log('chat 네임스페이스 접속 해제');
            socket.leave(roomId); // 연결이 끊기면 자동으로 방에서 나가지만 확실히 나가기 위해 추가한다.
            const currentRoom = socket.adapter.rooms[roomId];
            const userCount = currentRoom ? currentRoom.length : 0;
            // 현재 방의 사람 수를 구해서 참여자 수가 0이면 방을 제거하는 요청을 보낸다.
            if (userCount === 0) {
                axios.delete(`http://localhost:8080/room/${roomId}`).then(() => {
                    console.log('방 제거 요청 성공.');
                }).catch((error) => {
                    console.error(error);
                });
            } else {
                socket.to(roomId).emit('exit', {
                    user : 'system',
                    chat : `${req.session.color}님이 퇴장하였습니다.`,
                });
            }
        });
    });
    // -------------------------------------------------------------------------------
    /**
     * 연결 후에는 이벤트 리스너를 붙여준다.
     * connection 이벤트는 클라이언트가 접속했을 때 발생하고 콜백으로 소캣 객체를 제공한다. io와 socket 객체가 Socket.IO의 핵심이다.
     * socket.request 속성으로 요청 객체에 접근할 수 있고
     * socket.request.res 속성으로 응답 객체에 접근할 수 있다.
     */
    /**
        // io.on('connection', (socket) => {
        //     const req = socket.request;
        //     const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress; // 클라이언트의 IP를 알아내는 유명한 방법으로 알아두고 있으면 편하다.
            
        //     console.log('새로운 클라이언트 접속', ip, socket.id, req.ip);
        //     socket.on('disconnect', () => {
        //         console.log('클라이언트 접속 해제', ip, socket.id);
        //         clearInterval(socket.interval);
        //     });

        //     socket.on('error', (error) => {
        //         console.error(error);
        //     });

        //     // 사용자 정의 이벤트로 클라이언트에서 reply라는 이벤트명으로 데이터를 보낼 때 서버에서 받는 부분이다.
        //     // 이렇게 사용자 정의 이벤트명을 사용하는 것이 ws 모듈과는 다른 부분이다.
        //     socket.on('reply', (data) => {
        //         console.log(data);
        //     });

        //     socket.interval = setInterval(() => {
        //         // emit() 메소드의 첫번째 인자는 이벤트 이름, 두번째 인자는 데이터이다.
        //         // 클라이언트가 이 메세지를 받기 위해서는 new 이벤트 리스너를 만들어야 한다.
        //         socket.emit('news', 'Hello Socket.IO');
        //     }, 3000);
        // });
     */
    
};