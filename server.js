const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded( {extended : false } ));
const maria = require('mysql'); // 호환됌!!!
const connection = maria.createConnection({
  host     : 'svc.sel4.cloudtype.app',
  port     : 30001,
  user     : 'root',
  password : '12345678',
  database : 'tutorial'
})
// const connection = maria.createConnection({
//     host     : 'localhost',
//     port     :  3307,
//     user     : 'root',
//     password : '12345678',
//     database : 'opentutorials'
//   })
connection.connect();

app.post('/load', (req, res) => {
    connection.query(`select * from topic;`, (error, results) => {
        res.send(results);
    });
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
