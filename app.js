import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

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

app.get("/test1/login", async (req, res) => {
  const {
    body: { id, pw },
  } = req;

  const [rows] = await pool.query(
    `
  SELECT *
  FROM user 
  WHERE id = ?
  AND
  pw = ?
  `,
    [id, pw]
  );

  // {
  //   rows ? res.json(true) : res.json(false);
  // }

  if (rows.length === 0) {
    res.json(false);
  } else if (rows.length !== 0) {
    res.json(true);
  }

  // res.json(rows);

  // if (res.json) {
  //   res.json(true);
  // } else if (!res.json) {
  //   res.json(false);
  // }
});

app.post("/test1", async (req, res) => {
  const {
    body: { id, pw, name },
  } = req;

  // console.log(id, pw, name);
  // const { text } = req.body;

  const [row] = await pool.query(
    `
    INSERT INTO user
    SET id = ?,
    pw = ?,
    name = ?
    `,
    [id, pw, name]
  );

  const [rows] = await pool.query(`
    SELECT *
    FROM user
    `);

  res.json(rows);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
