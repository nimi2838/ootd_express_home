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
    body: { prdId },
  } = req;

  const [duplicate] = await pool.query(
    `
    SELECT *
    FROM product
    WHERE prdId =?
    `,
    [prdId]
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
      msg: "?????? ?????? ??????",
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
  if (search) {
    res.json(prdLow);
  }
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
// ?????? ???????????? ????????? ??????

app.get("/notices", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM Notice ORDER BY id DESC");

  res.json(rows);
});

app.post("/notices", async (req, res) => {
  const {
    body: { text },
  } = req;
  await pool.query(
    `
  INSERT INTO Notice
  SET reg_date = NOW(),
  perform_date = '2022-05-18 07:00:00',
  checked = 0,
  text = ?;
  `,
    [text]
  );
  const [newRows] = await pool.query(`
  SELECT *
  FROM Notice
  ORDER BY id
  DESC
  `);
  res.json(newRows);
});

app.get("/notices/:id/", async (req, res) => {
  //const id = req.params.id;
  const { id } = req.params;

  const [rows] = await pool.query(
    `
  SELECT *
  FROM Notice
  WHERE id = ?
  `,
    [id]
  );
  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  res.json(rows[0]);
});

app.patch("/notices/:id", async (req, res) => {
  const { id } = req.params;
  const { perform_date, text } = req.body;

  const [rows] = await pool.query(
    `
    SELECT *
    FROM Notice
    WHERE id = ?
    `,
    [id]
  );

  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
  }

  if (!perform_date) {
    res.status(400).json({
      msg: "perform_date required",
    });
    return;
  }

  if (!text) {
    res.status(400).json({
      msg: "text required",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    UPDATE Notice
    SET perform_date = ?,
    text = ?,
    WHERE id = ?
    `,
    [perform_date, text, id]
  );

  const [updatednotices] = await pool.query(
    `
    SELECT *
    FROM Notice
    ORDER BY id DESC
    `
  );
  res.json(updatednotices);
});

app.patch("/notices/check/:id", async (req, res) => {
  const { id } = req.params;
  //id??? Notice??? ?????? ?????? ?????? ?????????
  //SELECT * FROM?????? id?????? ????????? ??? id??? ?????? ?????? ????????????????
  //if (!rows) ??? 404????????? ???????????? msg: "not found" ??????.
  //??????, check ??????????????? ???????????? ?????? ???????????? ???.
  const [[rows]] = await pool.query(
    `
    SELECT *
  FROM Notice WHERE id = ?
  `,
    [id]
  );
  if (!rows) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }
  //????????? ?????????? ??? ?????? mySQL ??????
  await pool.query(
    `
  UPDATE Notice
  SET checked = ?
  WHERE id = ?
  `,
    //check?????? ????????? ??????????
    //????????? ?????? ???????????? ????????? (0?????? 1, 1?????? 0)??? ???????????????.
    [!rows.checked, id]
  );
  //?????? ?????? ???, ?????? ?????? ????????? ????????? ???????????? ?????? ?????? ???.
  const [updatedNotice] = await pool.query(
    `
      SELECT * FROM Notice ORDER BY id DESC`,
    [id]
  );
  //???????????????
  res.json(updatedNotice);
  //res.send(id);
});

app.delete("/notices/:id", async (req, res) => {
  const { id } = req.params;

  const [[NoticeRow]] = await pool.query(
    `
    SELECT *
    FROM Notice
    WHERE id = ?`,
    [id]
  );

  if (NoticeRow === undefined) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  const [rs] = await pool.query(
    `DELETE FROM Notice
    WHERE id = ?`,
    [id]
  );
  res.json({
    msg: `${id}??? ??????????????? ?????????????????????.`,
  });
});
app.post("/SBP", async (req, res) => {
  const { prdId } = req.body;

  const [[postItem]] = await pool.query(
    `
    SELECT * FROM product
    WHERE prdId = ?
    `,
    [prdId]
  );
  const id = postItem.prdId;
  await pool.query(
    `
    INSERT INTO cart
    SET prdId = ?,
    prdName = ?,
    prdEname = ?,
    prdPrice = ?,
    prdImg = ?
    `,
    [
      id,
      postItem.prdName,
      postItem.prdEname,
      postItem.prdPrice,
      postItem.prdImg,
    ]
  );

  const [CartRow] = await pool.query(
    `
    SELECT * FROM cart
    WHERE prdId = ?
    `,
    [id]
  );
});
app.get("/SBP", async (req, res) => {
  const {
    body: { prdId },
  } = req;
  const [ItemList] = await pool.query(
    `
    SELECT * FROM 
    cart 
    `,
    [prdId]
  );
  res.json(ItemList);
});

// ?????? ???????????? ????????? ??????

// const {abc} = await pool.query(`
// select * from follow_table where followid = ? and followedid = ?`,[a,b])
// if(abc==null){
//   ??????????????????
//   ???????????????+1
//   ??????????????????+1
//   follow_table ??????????????? ??????????????????
// }else {
//   ????????? ???????????????
//   ???????????????-1
//   ??????????????????-1
//   delete from follow_table where followid = ? and followedid = ?`,[a,b])
//   follow_table ??????????????? ?????????????????? ??????.
// }

app.post("/allCheck/:prdId", async (req, res) => {
  const { prdId } = req.params;
  const {
    body: { allCheck },
  } = req;

  // console.log(allCheck);

  await pool.query(
    `
      UPDATE product SET checked = 1 WHERE prdId = ?;
      `,
    [prdId]
  );
});

app.post("/addHeart/:userId/:prdId", async (req, res) => {
  const { prdId, userId } = req.params;
  const {
    body: { checked, allCheck },
  } = req;

  const [[duplicate]] = await pool.query(
    `
    SELECT *
    FROM heart
    WHERE prdId =? and userId = ?
    `,
    [prdId, userId]
  );

  if (!duplicate) {
    await pool.query(
      `
    INSERT INTO heart (prdId, userId, checked) VALUES (?,?,?);
    `,
      [prdId, userId, !checked]
    );
  } else {
    // console.log(!checked);
    await pool.query(
      `
      UPDATE heart SET checked = ? WHERE prdId = ? AND userId = ?;
      `,
      [!checked, prdId, userId]
    );

    // console.log("allCheck", allCheck);

    // await pool.query(
    //   `
    //   UPDATE product SET checked = 1 WHERE prdId = ?;
    //   `,
    //   [prdId]
    // );

    const [[check]] = await pool.query(
      `
      SELECT *
      FROM heart
      WHERE prdId =? and userId = ?
      `,
      [prdId, userId]
    );

    res.json(check);
  }
});

app.patch("/addHeart/:userId/:prdId", async (req, res) => {
  const { prdId, userId } = req.params;
  const {
    body: {
      checked,
      //  allCount
    },
  } = req;

  // console.log("checked", checked);
  // console.log(allCount);

  const [[duplicate]] = await pool.query(
    `
    SELECT *
    FROM heart
    WHERE prdId =? and userId = ?
    `,
    [prdId, userId]
  );

  // const [[productCheck]] = await pool.query(
  //   `SELECT *
  //   FROM product
  //   WHERE prdId = ?`,
  //   [prdId]
  // );

  // console.log(productCheck.checked);
  // res.json(productCheck);

  if (duplicate.length == 0) {
    await pool.query(
      `
    INSERT INTO heart (prdId, userId, checked) VALUES (?,?,0);
    `,
      [prdId, userId]
    );
  } else {
    await pool.query(
      `
      UPDATE heart SET checked = ? WHERE prdId = ? AND userId = ?
    `,
      [checked, prdId, userId]
    );
    await pool.query(
      `
      UPDATE product SET checked = 0 WHERE prdId = ?;`,
      [prdId]
    );
  }

  // res.json(duplicate);
});

app.post("/HeartCount/:userId/:prdId", async (req, res) => {
  const { prdId, userId } = req.params;

  const [[check]] = await pool.query(
    `
    SELECT *
    FROM heart
    WHERE prdId =? and userId = ?
    `,
    [prdId, userId]
  );

  res.json(check);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
