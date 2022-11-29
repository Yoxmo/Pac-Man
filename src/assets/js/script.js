/*

    [========================]
    [  Project: C4C - Pacman ]
    [  Code: -> Static <-    ]
    [  Version: 1.23         ]
    [========================]

*/
var login = document.querySelector('#login');
var regis = document.querySelector('#register');
var updat = document.querySelector('#update');
var delet = document.querySelector('#delete');

console.clear()
console.log(`

▐▓█▀▀▀▀▀▀▀▀▀█▓▌░▄▄▄▄▄░
▐▓█░PAC-MAN░█▓▌░█▄▄▄█░
▐▓█░░░░░░░░░█▓▌░█▄▄▄█░
▐▓█▄▄▄▄▄▄▄▄▄█▓▌░█████░
░░░░▄▄███▄▄░░░░░█████░

  <-[  Active  ]-> 

`)

if(login) {
    login.addEventListener('click', (e) => {
        e.preventDefault();
        const username = document.querySelector('#user').value;
        const password = document.querySelector('#pass').value;
            
        fetch('/login', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer abcdxyz',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        })
        .then((res) => {
            return res.json();
        })
        .then((data) => {
        if (data.result == '[*] Correct Password...') {
            localStorage.logged_in = true 
            localStorage.userauth = data.userauth
            localStorage.username = data.username
            window.location.reload();
        } else{
            alert(data.result);
            window.location.reload();
        }
    });
    });
}

if(regis) {
    regis.addEventListener('click', (e) => {
    e.preventDefault();
    const username = document.querySelector('#user').value;

    const password = document.querySelector('#pass').value;
        
    fetch('/register', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer abcdxyz',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            password,
        }),
    })
        .then((res) => {
            return res.json();
        })
        .then((data) => {
            if (data.result == '[*] Complete...') {
                localStorage.logged_in = true 
                localStorage.userauth = data.userauth
                localStorage.username = data.username
                window.location.reload();
            } else{
                alert(data.result);
                window.location.reload();
            }
        });
    });
}

if(updat) {
    updat.addEventListener('click', (e) => {
        e.preventDefault();
        const username = document.querySelector('#user').value;
        const userauth = localStorage.userauth;
        const code = document.querySelector('#code').value;
        let newpass = document.querySelector('#newpass').value;
        const pass = document.querySelector('#pass').value;

        if(newpass.length < 1){
            newpass = null;
        }

        console.log(newpass)
            
        fetch('/update', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer abcdxyz',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                userauth,
                newpass,
                pass,
                code
            }),
        })
        .then((res) => {
            return res.json();
        })
        .then((data) => {
        if (data.result == '[*] Update Pass Sucess...' || data.result == '[*] Update Sucess...') {
            console.log(data);
            localStorage.userauth = data.userauth;
            window.location.reload();
        } else{
            alert(data.result);
            window.location.reload();
        }
    });
    });
}

if(delet) {
    delet.addEventListener('click', (e) => {
        e.preventDefault();
        const username = localStorage.username;
        const userauth = localStorage.userauth;
        const password = document.querySelector('#pass').value;
            
        fetch('/delete', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer abcdxyz',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                userauth,
                password,
            }),
        })
        .then((res) => {
            return res.json();
        })
        .then((data) => {
        if (data.result == '[*] Deleted User...' || data.result == "[*] Complete..") {
            localStorage.logged_in = false;
            window.location.reload();
        } else{
            alert(data.result);
        }
    });
    });
}

function getAll(){
    fetch('/users', {
        method: 'GET',
        headers: {
            Authorization: 'Bearer abcdxyz',
            'Content-Type': 'application/json',
        },
    })
    .then((res) => {
        return res.json();
    })
    .then((data) => {
       const entries = Object.entries(data);
       entries.forEach((users)=>{
        const node = document.querySelector('#pac-lead');

        var listItem = document.createElement('li');
        var listAttr = document.createElement('pe');
        var listScore = document.createElement('small');

        var number = Math.floor(Math.random() * 200) + Math.floor(Math.random() * 200);

        listItem.setAttribute('style','margin: 15px');
        listAttr.setAttribute('style','margin-left: 15px;');
        listScore.setAttribute('style', 'float: right; margin-right: 15px;');

        listAttr.innerText = users[0];
        listScore.innerText = number;

        listItem.appendChild(listAttr);
        listItem.appendChild(listScore);

        node.appendChild(listItem);
        //console.log(users[1]);
       });
    });
}

function turnOn(id) {
    if(id = 'lead'){
        getAll();
    }

    document.getElementsByClassName('container')[0].style.display = 'none';
    document.getElementById(id).style.display = '';
}

function turnOff(id) {
    document.getElementsByClassName('container')[0].style = '';
    document.getElementById(id).style.display = 'none';
}

function loadcode(username) {
    fetch('/code', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer abcdxyz',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username
        }),
    })
      .then((res) => {
          return res.json();
      })
      .then((data) => {
        if(data != '[-] No User...'){
            loading = data.code.toString().split('\n').reverse();
            loading.forEach((item)=> {
                var tableRow = document.querySelector('.cm-line');
                var tableRowClone = tableRow.cloneNode(true);
                tableRowClone.innerText = item;
                tableRow.parentNode.insertBefore(tableRowClone, tableRow.nextSibling);
            });
        }
  });
}

function saveCode() {
    var code = document.querySelector('.cm-content').innerText;

    fetch('/update', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer abcdxyz',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: localStorage.username,
            userauth: localStorage.userauth,
            code: code,
            newpass: null
        }),
     })
        .then((res) => {
            return res.json();
        })
        .then((data) => {
            console.log(data);
      });

    return code
}

function chechLogin(status, path) {
    var status =  localStorage.getItem('logged_in');
    var path = window.location.pathname;

    if(status == 'true'){
        if (path == '/login' || path == '/register') {
            window.location.replace('/');
        } else if(path == '/'){
            loadcode(localStorage.username);
            console.log('[*] Current path: [ -< Home >- ]');
        } else if(path == '/account'){
            fetch('/code', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer abcdxyz',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: localStorage.username
                }),
            })
              .then((res) => {
                  return res.json();
              })
              .then((data) => {
                if(data != '[-] No User...'){
                document.querySelector("#code").value = data.code.toString();
             }
            });
            document.querySelector("#user").value = localStorage.username;
        }
        else {
            console.log('[*] Current path: '+path);
        }
    } else{
        if (path == '/login' || path == '/register') {
            console.log('[*] Current path: '+path);
        } else {
            window.location.replace('/login');
        }
    }
}

//chechLogin()

// function music(onf) {
// 	document.getElementById("myAudio").play(); 
// }