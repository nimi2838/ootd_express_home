import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.get("/test2", async (req, res) => {
  const [rows] = await pool.query(
    `
    SELECT * FROM product
  `
  );

  res.json(rows);
});

app.post("/test1/doLogin", async (req, res) => {
  const {
    body: { id, pw },
  } = req;

  const [[userRow]] = await pool.query(
    `
  SELECT *
  FROM user
  WHERE id = ?
  AND
  pw = ?
  `,
    [id, pw]
  );
  if (userRow) {
    return res.send(true);
  }
  res.send(false);
});

app.post("/test1", async (req, res) => {
  const {
    body: { id, pw, name },
  } = req;

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

app.post("/prdlist", async (req, res) => {
  const {
    body: { prdno },
  } = req;
  var like = "%" + prdno + "%";

  const [prdRow] = await pool.query(
    `
    SELECT *
    FROM product 
    WHERE category LIKE ?;
  `,
    [like]
  );

  res.json(prdRow);
});

app.post("/product", async (req, res) => {
  const {
    body: { prdId },
  } = req;

  const [[prdRow]] = await pool.query(
    `
  SELECT *
  FROM product
  WHERE prdId = ?
  `,
    [prdId]
  );

  res.json(prdRow);
});

app.post("/cart", async (req, res) => {
  const {
    body: { prdId, userId },
  } = req;

  const [duplicate] = await pool.query(
    `
    SELECT *
    FROM cart
    WHERE prdId =? and userId = ?
    `,
    [prdId, userId]
  );

  const [[product]] = await pool.query(
    `
    SELECT *
    FROM product
    WHERE prdId =?
    `,
    [prdId]
  );

  if (duplicate.length == 0) {
    const [row] = await pool.query(
      `
    INSERT INTO cart (prdId, userId, checked,amount, price ) VALUES (?,?, false, 1, ?);
    
    `,
      [prdId, userId, product.prdPrice]
    );
  } else {
    res.json({
      msg: "같은 상품 존재",
    });
  }
});

app.post("/cartlist", async (req, res) => {
  const {
    body: { userId },
  } = req;

  const [cartRow] = await pool.query(
    `
    SELECT *
    FROM cart
    WHERE userId = ?
    `,
    [userId]
  );

  res.json(cartRow);
});

app.patch("/amount/:prdId", async (req, res) => {
  const { prdId } = req.params;
  // const { setCount } = req.body;
  const {
    body: { count, price },
  } = req;

  await pool.query(
    `
    UPDATE cart SET amount = ?, price = ? WHERE prdId = ?
  `,

    [count, price, prdId]
  );

  const [[cartRow]] = await pool.query(
    `
    SELECT *
    FROM cart
    WHERE prdId = ?
    `,
    [prdId]
  );

  res.json(cartRow);
});

app.post("/cartList2", async (req, res) => {
  const {
    body: { prdId },
  } = req;

  const [[cartRow]] = await pool.query(
    `
    SELECT *
    FROM product
    WHERE prdId = ?
    `,
    [prdId]
  );

  res.json(cartRow);
});

app.post("/totalPrice", async (req, res) => {
  const {
    body: { userId },
  } = req;

  const [[totalPrice]] = await pool.query(
    `
    SELECT SUM(price) AS price FROM cart WHERE userId = ?`,
    [userId]
  );

  res.json(totalPrice);
});

app.patch("/check/:userId/:prdId", async (req, res) => {
  const { userId, prdId } = req.params;

  const [[rows]] = await pool.query(
    `
    SELECT *
  FROM cart where userId = ? and prdId = ?
  `,
    [userId, prdId]
  );
  await pool.query(
    `
  UPDATE cart
  SET checked = ?
  WHERE userId = ? and prdId =?
  `,

    [!rows.checked, userId, prdId]
  );
  res.send(userId);
});

app.post("/cartDelete", async (req, res) => {
  const {
    body: { prdId, userId },
  } = req;

  const [[cartRow]] = await pool.query(
    `
    SELECT *
    FROM cart
    WHERE userId = ? and prdId = ?
    `,
    [userId, prdId]
  );

  if (cartRow.length != 0) {
    await pool.query(
      `
    DELETE FROM cart 
    WHERE userId = ? AND prdId = ?;
  `,

      [userId, prdId]
    );
  }

  const [cartDelete] = await pool.query(
    `
    SELECT *
    FROM cart
    WHERE userId = ? 
    `,
    [userId]
  );
  // console.log(cartDelete);

  res.json(cartDelete);
});

app.post("/SearchPage", async (req, res) => {
  const {
    body: { search },
  } = req;
  var like = "%" + search + "%";
  const [prdLow] = await pool.query(
    `
    SELECT *
    FROM product
    WHERE prdName LIKE ?
    `,
    [like]
  );
  // console.log(prdLow);
  if (search) {
    res.json(prdLow);
  }
});

app.patch("/addHeart", async (req, res) => {
  const {
    body: { prdId, userId, checked },
  } = req;

  const [duplicate] = await pool.query(
    `
    SELECT *
    FROM heart
    WHERE prdId =? and userId = ?
    `,
    [prdId, userId]
  );

  const [[product]] = await pool.query(
    `
    SELECT *
    FROM product
    WHERE prdId =?
    `,
    [prdId]
  );

  if (duplicate.length == 0) {
    const [row] = await pool.query(
      `
    INSERT INTO heart (prdId, userId, checked) VALUES (?,?, ?);
    
    `,
      [prdId, userId, !checked]
    );
  } else {
    const [row] = await pool.query(
      `
      UPDATE heart SET checked = ? WHERE prdId = ? AND userId = ? 
    
    `,
      [!checked, prdId, userId]
    );
  }
});

app.post("/getHeart", async (req, res) => {
  const {
    body: { userId, prdId },
  } = req;
  const [[prdLow]] = await pool.query(
    `
    SELECT *
    FROM heart
    WHERE userId =? and prdId =?
    `,
    [userId, prdId]
  );

  res.json(prdLow);
});

app.post("/HeartCount", async (req, res) => {
  const {
    body: { prdId },
  } = req;
  const [[prdLow]] = await pool.query(
    `
    SELECT count(checked) as checked FROM heart WHERE prdId = ? AND (checked = 1 OR checked = TRUE);
    `,
    [prdId]
  );

  res.json(prdLow);
  console.log(prdLow);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
