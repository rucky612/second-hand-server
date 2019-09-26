const connection = require("../database");
const _ = require("lodash");
const aws = require("../aws");

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

const Get = async (req, res) => {
  try {
    const { u_id } = req.decoded;
    const countSQL = "SELECT COUNT(*) FROM Cart";
    const sql =
      "SELECT p_id, p_name, p_description, p_price, c_id, c_amount FROM Cart";
    const joinSQL =
      "JOIN User ON User.u_id = Cart.c_u_id JOIN Product ON Product.p_id = Cart.c_p_id";
    const rows = await connection.query(`${sql} ${joinSQL} WHERE ?`, { u_id });
    const count = await connection.query(`${countSQL} ${joinSQL} WHERE ?`, {
      u_id
    });
    const setRows = await setResRows(rows, u_id);
    console.log("The Get Method is : ", setRows, count);
    res.send({ rows: setRows, count: count[0]["COUNT(*)"] });
  } catch (e) {
    console.log("Error while performing Get.", e);
    res.status(403).send(e);
  }
};

const Post = async (req, res) => {
  const sql = "INSERT INTO Cart SET ?";
  const { p_id, c_amount } = req.body;
  const { u_id } = req.decoded;
  try {
    const cart = {
      c_p_id: p_id,
      c_amount,
      c_u_id: u_id
    };
    const rows = await connection.query(sql, cart);
    res.send(rows);
  } catch (e) {
    console.log("Error while performing Post.", e);
    res.status(403).send(e);
  }
};

const Delete = (req, res) => {
  const sql = "DELETE FROM Cart WHERE ?";
  try {
    const rows = connection.query(`${sql}`, req.query);
    res.send(rows);
  } catch (e) {
    console.log("Error while performing Delete.", e);
    res.status(403).send(e);
  }
};

exports.GET = Get;
exports.POST = Post;
exports.DELETE = Delete;
