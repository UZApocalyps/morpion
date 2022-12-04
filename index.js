const socket = openWebSocket();
let json = {
    channel: "/move",
    data: {
        cell: ""
    }
}


socket.onopen = function (event) {
    socket.send(JSON.stringify({
        channel: "/echo",
        data: {
            id: "Suce ta mère"
        }
    }))
}
let yourTurn = true;

//if url contains join=true, then you are joining a game
if (document
    .location
    .href
    .indexOf("join=true") > -1) {
        yourTurn = false
}

let symbol = '&#10060;';
let otherPlayer = '&#11093;';
document.addEventListener('DOMContentLoaded', function () {
    
    document.querySelector("#Create").addEventListener('click', function (el) {
        document.querySelector(".game").style.display = "flex";
        // reset the board
        let cells = document.querySelectorAll('.cell');
        for (var i = 0; i < cells.length; i++) {
            cells[i].innerHTML = '';
        }

        let id = Math.floor(Math.random() * 1000)
        document.querySelector(".ID").innerHTML = id;
        socket.send(JSON.stringify({
            channel: "/room/create",
            data: {
                id: id
            }
        }))
        // head to game page
    })

    document.querySelector("#join").addEventListener('click', function (el) {
        yourTurn = false;
        document.querySelector(".game").style.display = "flex";
        let cells = document.querySelectorAll('.cell');
        for (var i = 0; i < cells.length; i++) {
            cells[i].innerHTML = '';
        }
        socket.send(JSON.stringify({
            channel: "/room/join",
            data: {
                id: parseInt(document.querySelector("#gameRoom").value)
            }
        }))

        // head to game page
    })

    for (var i = 0; i < 9; i++) {
        document.querySelector('#cell-' + i).addEventListener('click', function (el) {
            if (yourTurn) {
                // do something
                el.target.innerHTML = symbol;
                json.data.cell = el.target.id;
                socket.send(JSON.stringify(json));
                yourTurn = false;

                if(checkWin()){
                    alert("You win!");
                    document.location.href = "index.html";
                }
                if(checkDraw()){
                    alert("Draw!");
                    //head back to index
                    document.location.href = "index.html";
                }
            }
        })
    }
})
function openWebSocket() {
    // Create WebSocket connection.
    const socket = new WebSocket('ws://192.168.195.56:5000');

    // Listen for messages
    socket.onmessage = (event) => {
        let msg = JSON.parse(event.data);
        let datas = JSON.parse(msg.data);
        console.log(msg);
        if (msg.channel === '/moved') {
            document.querySelector('#'+datas.cell).innerHTML = otherPlayer;
            yourTurn = true;
            if(checkWin()){
                alert("You lose!");
                //head back to index
                document.location.href = "index.html";
            }
            if(checkDraw()){
                alert("Draw!");
                //head back to index
                document.location.href = "index.html";
            }
        };
    };

    return socket;
}

function checkWin(){
    let cells = document.querySelectorAll('.cell');
    let win = false;
    for(var i = 0; i < 3; i++){
        if(cells[i].innerHTML === cells[i+3].innerHTML && cells[i].innerHTML === cells[i+6].innerHTML && cells[i].innerHTML !== ''){
            win = true;
        }
    }
    for(var i = 0; i < 9; i+=3){
        if(cells[i].innerHTML === cells[i+1].innerHTML && cells[i].innerHTML === cells[i+2].innerHTML && cells[i].innerHTML !== ''){
            win = true;
        }
    }
    if(cells[0].innerHTML === cells[4].innerHTML && cells[0].innerHTML === cells[8].innerHTML && cells[0].innerHTML !== ''){
        win = true;
    }
    if(cells[2].innerHTML === cells[4].innerHTML && cells[2].innerHTML === cells[6].innerHTML && cells[2].innerHTML !== ''){
        win = true;
    }
    return win;
}
function checkDraw(){
    let cells = document.querySelectorAll('.cell');
    let draw = true;
    for(var i = 0; i < 9; i++){
        if(cells[i].innerHTML === ''){
            draw = false;
        }
    }
    return draw;
}