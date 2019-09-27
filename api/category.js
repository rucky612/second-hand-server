const _ = require("lodash");
const connection = require("../database");
const aws = require("../aws");

const Get = async (req, res) => {
  try {
    const { offset, limit, search, sorted } = req.query;
    const countSQL = "SELECT COUNT(*) FROM Category";
    const sql = "SELECT * FROM Category";
    const searchObj = search ? JSON.parse(search) : null;
    const sortedObj = sorted ? JSON.parse(sorted) : null;
    const searchStr =
      searchObj && !_.isEmpty(searchObj)
        ? _.reduce(
            _.mapValues(searchObj, v => v),
            (sql, value, key) =>
              value ? `${sql} ${key} REGEXP '${value}' AND` : sql,
            "WHERE"
          )
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
    const limitSQL = `LIMIT ${offset}, ${limit}`;
    const rows = await connection.query(
      `${sql} ${searchSQL} ${sortedOSQL} ${limitSQL}`
    );
    const count = await connection.query(`${countSQL} ${searchSQL}`);
    console.log("The Get Method is : ", rows, count);
    res.send({ rows, count: count[0]["COUNT(*)"] });
  } catch (err) {
    console.log("Error while performing Get.", err);
    res.status(403).send(err);
  }
};

const Post = async (req, res) => {
  try {
    const sql = "INSERT INTO Category SET ?";
    const rows = await connection.query(sql, req.body);
    console.log("The Post Method is : ", rows);
    res.send(rows);
  } catch (err) {
    console.log("Error while performing Post.", err);
    res.status(403).send(err);
  }
};

const Delete = async (req, res) => {
  try {
    const sql = "DELETE FROM Category WHERE ?";
    const selectPhotoSQL =
      "SELECT pi_name FROM Product JOIN Category ON Product.p_cg_id = Category.cg_id JOIN Photo ON Product.p_id = Photo.pi_p_id WHERE ?";
    const deleteProductSQL =
      "DELETE FROM Product JOIN Category Product.p_cg_id = Category.cg_id WHERE ?";
    const rows = connection.query(selectPhotoSQL, req.body);
    if (Array.isArray(rows)) {
      rows.forEach(row => {
        aws.deleteImg(row.pi_name);
      });
    }
    connection.query(deleteProductSQL, req.body);
    const success = await connection.query(sql, req.body);
    console.log("The Delete Method is : ", success);
    res.send(success);
  } catch (err) {
    console.log("Error while performing Delete.", err);
    res.status(403).send(err);
  }
};

exports.GET = Get;
exports.POST = Post;
exports.DELETE = Delete;
