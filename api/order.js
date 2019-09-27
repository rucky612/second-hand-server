const connection = require("../database");
const aws = require("../aws");
const _ = require("lodash");

const makeSearchSQL = (sql, value, key) => {
  if (value && key === "o_status") {
    return `${sql} ${key} = '${value}' AND`;
  }
  if (value && key === "o_price") {
    return `${sql} p_price REGEXP '${value}' AND`;
  }
  if (value) {
    return `${sql} ${key} REGEXP '${value}' AND`;
  }
  return sql;
};

const getImgObj = async (u_id, p_id) => {
  const sql = "SELECT pi_name, pi_caption, pi_size, pi_create_by FROM Cart";
  const joinSQL =
    "JOIN User ON User.u_id = Cart.c_u_id JOIN Product ON Product.p_id = Cart.c_p_id JOIN Photo ON Photo.pi_p_id = Product.p_id";
  const searchSQL = `WHERE u_id = '${u_id}' AND p_id = '${p_id}'`;
  const limitSQL = "LIMIT 0, 1";
  try {
    const rows = await connection.query(
      `${sql} ${joinSQL} ${searchSQL} ${limitSQL}`,
      {
        u_id,
        p_id
      }
    );
    try {
      const imgSrc = await aws.getUrl(rows[0].pi_name);
      return {
        src: imgSrc,
        id: rows[0].pi_name,
        alt: rows[0].pi_caption,
        size: rows[0].pi_size,
        date: rows[0].pi_create_by
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
};

const setResRows = async (rows, u_id) =>
  Promise.all(
    _.map(rows, async row => ({
      ...row,
      p_image: await getImgObj(u_id, row.p_id)
    }))
  );

exports.GET_ONE = async (req, res) => {
  try {
    const { u_id } = req.decoded;
    const countSQL = "SELECT COUNT(*) FROM Orders";
    const sql =
      "SELECT p_id, p_name, p_description, p_price, o_id, o_amount, o_status FROM Orders";
    const joinSQL =
      "JOIN User ON User.u_id = Orders.o_u_id JOIN Product ON Product.p_id = Orders.o_p_id";
    const rows = await connection.query(`${sql} ${joinSQL} WHERE ?`, { u_id });
    const count = await connection.query(`${countSQL} ${joinSQL} WHERE ?`, {
      u_id
    });
    const setRows = await setResRows(rows, u_id);
    console.log("The Get Method is : ", setRows, count);
    res.send({ rows: setRows, count: count[0]["COUNT(*)"] });
  } catch (e) {
    console.log("Error while performing Get One.", e);
    res.status(403).send(e);
  }
};

exports.GET = async (req, res) => {
  try {
    const { offset, limit, search, sorted } = req.query;
    const countSQL = "SELECT COUNT(*) FROM Orders";
    const sql =
      "SELECT o_id, o_amount, o_status, p_price AS o_price, p_name AS o_product, u_name AS o_user FROM Orders";
    const searchObj = search ? JSON.parse(search) : null;
    const sortedObj = sorted ? JSON.parse(sorted) : null;
    const searchStr =
      searchObj && !_.isEmpty(searchObj)
        ? _.reduce(_.mapValues(searchObj, v => v), makeSearchSQL, "WHERE")
        : "";
    const sortedStr =
      sortedObj && !_.isEmpty(sortedObj)
        ? _.reduce(
            _.mapValues(sortedObj, v => v),
            (sql, value, key) =>
              `${sql} CAST(${key} AS UNSIGNED) ${value ? "DESC" : "ASC"},`,
            "ORDER BY"
          )
        : "";
    const searchSQL = searchStr.substring(0, searchStr.lastIndexOf(" AND"));
    const sortedOSQL = sortedStr.substring(0, sortedStr.lastIndexOf(","));
    const joinSQL =
      "JOIN Product ON Orders.o_p_id = Product.p_id JOIN User ON Orders.o_u_id = User.u_id";
    const limitSQL = `LIMIT ${offset}, ${limit}`;
    const rows = await connection.query(
      `${sql} ${joinSQL} ${searchSQL} ${sortedOSQL} ${limitSQL}`
    );
    const count = await connection.query(`${countSQL} ${joinSQL} ${searchSQL}`);
    console.log("The Get Method is : ", rows, count);
    res.send({ rows, count: count[0]["COUNT(*)"] });
  } catch (err) {
    console.log("Error while performing Get.", err);
    res.status(403).send(err);
  }
};

exports.PUT = async (req, res) => {
  try {
    const sql = `UPDATE Orders SET ? WHERE o_id=?`;
    const rows = await connection.query(sql, [req.body, req.body.o_id]);
    console.log("The Put Method is : ", rows);
    res.send(rows);
  } catch (err) {
    console.log("Error while performing Put.", err);
    res.status(403).send(err);
  }
};

exports.POST = (req, res) => {
  const { u_id } = req.decoded;
  const { orders } = req.body;
  const SQL = "INSERT INTO Orders SET ?";
  const deleteCartSQL = "DELETE FROM Cart WHERE ?";
  const postAllOrders = async (id, orders) =>
    Promise.all(
      _.map(orders, async ({ c_id, ...order }) => {
        try {
          const postOrder = {
            o_u_id: id,
            ...order
          };
          const putProductSQL = `UPDATE Product SET p_amount = p_amount - ${order.o_amount} WHERE ?`;
          await connection.query(SQL, postOrder);
          await connection.query(deleteCartSQL, { c_id });
          await connection.query(putProductSQL, { p_id: order.o_p_id });
          return {
            msg: "success",
            success: true
          };
        } catch (e) {
          console.log("Order post is error", e);
          throw e;
        }
      })
    );
  try {
    const rows = postAllOrders(u_id, orders);
    res.send(rows);
  } catch (e) {
    console.log("Error while performing Get.", e);
    res.status(403).send(e);
  }
};
