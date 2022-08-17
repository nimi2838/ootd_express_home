import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());

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

app.get("/test1", async (req, res) => {
  const [rows] = await pool.query(
    `
  SELECT *
  FROM user 
  `
  );

  res.json(rows);
});

app.post("/test1", async (req, res) => {
  const {
    body: { id, pw, name },
  } = req;
  console.log(id, pw, name);

  await pool.query(
    `
    INSERT INTO user
    SET id = ?, pw = ?, name =?
    `
  );
  // const [rows] = await pool.query(
  //   `
  // SELECT *
  // FROM user
  // `
  // );

  // res.json(rows);
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
