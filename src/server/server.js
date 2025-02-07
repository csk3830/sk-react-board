// 설치한 라이브러리 변수로 받아오기
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

//express 사용하기 위한 app 생성
const app = express();

//express 사용할 서버포트 설정
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

//DB 접속
const db = mysql.createConnection({
    host : 'localhost',
    user: 'react',
    password: 'mysql',
    port:'3306',
    database:'db_react'
});

// express 접속
app.listen(PORT, ()=>{
    console.log(`server connecting on : http://localhost:${PORT}`);
});

//db 연결
db.connect((err)=>{
    if(!err){
        console.log("success");

    }else{
        console.log("fail");
    }
});

//db에서 값을 가져오는 쿼리문
app.get('/', (req,res)=>{
    res.send("React Server Connect Success!!")
});

//게시글 목록 가져오기
app.get('/list', (req, res) => {
    const page = parseInt(req.query.page) || 1; // 현재 페이지
    const limit = 8; // 페이지당 항목 수
    const offset = (page - 1) * limit; // 시작 위치
    const search = req.query.search || ''; // 검색어
    const category = req.query.category || 'title'; // 검색 카테고리

    // 검색 쿼리 동적으로 생성
    let countSql = `SELECT COUNT(*) AS totalCount FROM sk_board WHERE ${category} LIKE ?`;
    let sql = `
        SELECT b.*, COUNT(c.id) AS comment_count
        FROM sk_board b
        LEFT JOIN comments c ON b.id = c.post_id
        WHERE ${category} LIKE ?
        GROUP BY b.id
        ORDER BY b.id DESC
        LIMIT ? OFFSET ?
    `;

    db.query(countSql, [`%${search}%`], (err, countData) => {
        if (err) {
            console.log(err);
            return res.send('전송 오류');
        }

        const totalCount = countData[0].totalCount; // 총 게시글 수
        const totalPages = Math.ceil(totalCount / limit); // 전체 페이지 수

        db.query(sql, [`%${search}%`, limit, offset], (err, data) => {
            if (!err) {
                res.send({ data, totalPages }); // 데이터와 totalPages를 반환
            } else {
                console.log(err);
                res.send('전송 오류');
            }
        });
    });
});


//게시물 하나 가져오기 :id
app.get('/detail/:id', (req, res)=>{
    const id = req.params.id;
    const sql = `select * from sk_board where id=${id}`;
    db.query(sql, (err, data)=>{
        if(!err){
            res.send(data);
        }else{
            console.log(err);
            res.send('전송오류');
        }
    })
})

//게시물 삭제
app.post('/delete/:id', (req, res)=>{
    const id = req.params.id;
    const sql = `delete from sk_board where id=${id}`
    db.query(sql, (err, data)=>{
        if(!err){
            res.send(data);
        }else{
            console.log(err);
            res.send('전송오류');
        }
    })
})

//게시글 등록
app.post('/write', (req, res)=>{
    const {title, writer, contents } = req.body;

    const sql = `insert into sk_board(title, writer, contents) value (?,?,?)`;
    db.query(sql, [title, writer, contents], (err, data)=>{
        if(!err){
            // res.send("OK");
            res.sendStatus(200); //전송잘됨.
        }else{
            console.log(err);
            res.send('전송오류');
        }
    })

})

//게시글 수정
app.get('/modify/:id', (req, res)=>{
    //파라미터 가져오기
    const id = req.params.id;
    console.log(`/modify/${id}`);
    const sql = `select * from sk_board where id=${id}`;
    db.query(sql, (err, data)=>{
        if(!err){
            res.send(data);
        }else{
            console.log(err);
            res.send('전송오류');
        }
    })
})
app.post('/modify/:id', (req, res) => {
    const id = req.params.id;
    const { title, writer, contents } = req.body;
    console.log(`/modify/${id}`);
    const sql = `update sk_board set title=?, writer=?, contents=? where id=?`;
    db.query(sql, [title, writer, contents, id], (err, data) => {
        if (!err) {
            res.sendStatus(200); // 수정잘됨.
        } else {
            console.log(err);
            res.send('전송오류');
        }
    });
});

//조회수
app.post('/views/:id', (req, res) => {
    const id = req.params.id;
    const sql = `update sk_board set views = views + 1 where id =${id}`;
    console.log(`/views/${id}`);
    db.query(sql, (err, data)=>{
        if(!err){
            res.send(data);
        }else{
            console.log(err);
            res.send('전송오류');
        }
    })
});

//댓글
app.get('/comments/:postId', (req, res) => {
    const postId = req.params.postId;
    const sql = 'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC';
    db.query(sql, [postId], (err, data) => {
        if (!err) {
            res.send(data);
        } else {
            console.log(err);
            res.send('전송오류');
        }
    });
});
app.post('/comments', (req, res) => {
    const { postId, user, content } = req.body;
    const sql = 'INSERT INTO comments (post_id, user, content) VALUES (?, ?, ?)';
    db.query(sql, [postId, user, content], (err, data) => {
        if (!err) {
            res.sendStatus(200); // 댓글 등록 성공
        } else {
            console.log(err);
            res.send('전송오류');
        }
    });
});
app.delete('/comments/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM comments WHERE id = ?';
    db.query(sql, [id], (err, data) => {
        if (!err) {
            res.sendStatus(200); // 댓글 삭제 성공
        } else {
            console.log(err);
            res.send('전송오류');
        }
    });
});
