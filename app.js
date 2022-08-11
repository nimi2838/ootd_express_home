import express from "express";
import mysql from "mysql2/promise";

const app = express();
const port = 4000;

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "team",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

app.get('/user', async (req, res) => {
  const [rows] = await pool.query(
    `
  SELECT *
  FROM user 
  `);
  
  res.json(rows);
});

// app.post('/user', async (req, res) => {
//   await pool.query(
//     `
//     `
//   )
// })


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});