const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded( {extended : false } ));
const mysql = require('mysql');
const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '12345678',
  database : 'opentutorials'
})
connection.connect();

app.get('/', (req, res) => {
    connection.query(`select * from topic;`, (error, results) => {
        var list = '<ol id="list">';
        var i = 0;
        while(i < results.length){
        list = list + `<li id="${results[i].id}">${results[i].title}</li>`;
        i = i + 1;
        }
        list = list+'</ol>';

        const html = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <style>
                #maindiv {
                    display: flex;
                }
                #post {
                    margin-left:50px;
                }
                #create, #modify {
                    margin-left:50px;
                    margin-top:30px;
                }
                #buttons, #create, #modify, #id {
                    display: none;
                }
                #createbutton {
                    margin-left:65px;
                }
                #create input, #modify input {
                    display: block;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
        <div id="maindiv">
            ${list}
            <div id="post">
                <h1 id="title"></h1>
                <p id="author"></p>
                <p id="content"></p>
                <div id="buttons">
                    <button id="modifybutton">수정</button>
                    <button id="delbutton">삭제</button>
                </div>
                <p id="id"></p>
            </div>
            <div id="create">
                <input id="newTitle" placeholder="title">
                <input id="newauthor" placeholder="author">
                <input id="newdescription" placeholder="description">
                <button id="upload">ok</button>
            </div>
            <div id="modify">
                <input id="changetitle">
                <input id="changeauthor">
                <input id="changedescription">
                <button id="change">ok</button>
            </div>
        </div>
        <div>
            <button id="createbutton">+</button>
        </div>
        
        <script>
            const liElements = document.querySelectorAll('#list li');
            liElements.forEach((li) => {
                li.addEventListener('click', () => {
                    document.getElementById("create").style.display = "none";
                    document.getElementById("modify").style.display = "none";
                    document.getElementById("post").style.display = "block";
                    fetch('/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({id:li.id})
                    })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById("title").innerHTML = data[0].title;
                        document.getElementById("author").innerHTML = data[0].name;
                        document.getElementById("content").innerHTML = data[0].description;
                        document.getElementById("buttons").style.display = "block";
                        document.getElementById("id").innerHTML = data[0].id;});
                    });
            });
            document.getElementById("delbutton").addEventListener('click', () => {
                fetch('/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({id:document.getElementById("id").innerHTML})
                    })
                    .then(location.reload(true));
            })
            document.getElementById("createbutton").addEventListener('click', () => {
                document.getElementById("post").style.display = "none";
                document.getElementById("modify").style.display = "none";
                document.getElementById("create").style.display = "block";
            })
            document.getElementById("upload").addEventListener('click', () => {
                fetch('/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({title:document.getElementById("newTitle").value,
                         description:document.getElementById("newauthor").value,
                         author:document.getElementById("newdescription").value})
                    })
                    .then(location.reload(true))
                    .then(location.reload(true));
                })
            document.getElementById("modifybutton").addEventListener('click', () => {
                document.getElementById("changetitle").value = document.getElementById("title").innerHTML;
                document.getElementById("changeauthor").value = document.getElementById("author").innerHTML;
                document.getElementById("changedescription").value = document.getElementById("content").innerHTML;
        
                document.getElementById("post").style.display = "none";
                document.getElementById("create").style.display = "none";
                document.getElementById("modify").style.display = "block";
            })
            document.getElementById("change").addEventListener('click', () => {
                fetch('/modify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({id:document.getElementById("id").innerHTML,
                        title:document.getElementById("changetitle").value,
                        description:document.getElementById("changeauthor").value,
                        author:document.getElementById("changedescription").value})
                    })
                    .then(location.reload(true))
            })
        </script>
        </body>            `;
    res.send(html);
    })
});

app.post('/', (req, res) => {
    connection.query(`select * from topic left join author on author_id=aid where id=?;`, req.body.id, (error, results) => {
        res.send(results);
    });
});

app.post('/delete', (req, res) => {
    connection.query(`delete from topic where id=?;`, req.body.id, (error, results) => {
        res.send(results);
    });
});

app.post('/create', (req, res) => {
    new Promise((resolve, reject) => {
        connection.query(`select * from author where name=?;`, req.body.author, (error, results) => {
            if (results.length === 0) {
                connection.query(`insert into author (name) values('${req.body.author}');`, (error, results) => {
                    resolve(results.insertId);
                })
            }
            else resolve(results[0].aid);
        })
    })
    .then(authorid => {
        connection.query(`insert into topic (title, description, created, author_id) \
        values ('${req.body.title}', '${req.body.description}', '2023-08-02', '${authorid}');`, (error, results) => {
            res.send(results);
        });
    })
});

app.post('/modify', (req, res) => {
    new Promise((resolve, reject) => {
        connection.query(`select * from author where name=?;`, req.body.author, (error, results) => {
            if (results.length === 0) {
                connection.query(`insert into author (name) values('${req.body.author}');`, (error, results) => {
                    resolve(results.insertId);
                })
            }
            else resolve(results[0].aid);
        })
    })
    .then(authorid => {
        connection.query(`UPDATE topic SET title = '${req.body.title}', description = '${req.body.description}', author_id = '${authorid}' WHERE id = '${req.body.id}'`, (error, results) => {
            res.send(results);
        });
    })
})

// connection.end();
app.listen(3000, () => {console.log('listening...')});

