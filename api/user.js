const jwt = require("jsonwebtoken");
const connection = require("../database");
const _ = require("lodash");

const makeSearchSQL = (sql, value, key) => {
  if (value && key === "u_status") {
    return `${sql} ${key} = '${value}' AND`;
  }
  if (value) {
    return `${sql} ${key} REGEXP '${value}' AND`;
  }
  return sql;
};

exports.GET_ONE = async (req, res) => {
  try {
    const { u_id } = req.decoded;
    const SQL =
      "SELECT u_name, u_email, u_status, u_address, u_phone FROM User";
    const rows = await connection.query(`${SQL} WHERE ?`, { u_id });
    res.send(rows);
  } catch (err) {
    console.log("Error while performing Get.", err);
    res.status(403).send(err);
  }
};

exports.GET = async (req, res) => {
  try {
    const { offset, limit, search, sorted } = req.query;
    const countSQL = "SELECT COUNT(*) FROM User";
    const sql =
      "SELECT u_id, u_name, u_email, u_status, u_address, u_phone FROM User";
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

exports.PUT = async (req, res) => {
  try {
    const id =
      req.decoded && req.decoded.u_id ? req.decoded.u_id : req.body.u_id;
    console.log(req.decoded, req.body);
    const user = { ...req.body };
    delete user.token;
    const sql = `UPDATE User SET ? WHERE u_id=?`;
    const rows = await connection.query(sql, [user, id]);
    console.log("The Put Method is : ", rows);
    res.send(rows);
  } catch (err) {
    console.log("Error while performing Put.", err);
    res.status(403).send(err);
  }
};

exports.login = async (req, res) => {
  const secret = req.app.get("jwt-secret");
  const userName = req.body.u_name;
  const sql = "SELECT * FROM User WHERE ?";
  const checkPwd = pwd => pwd === req.body.u_password;
  try {
    const findUser = await connection.query(sql, { u_name: userName });
    const user = findUser[0];
    if (checkPwd(user.u_password)) {
      const token = await jwt.sign(
        {
          u_id: user.u_id,
          u_name: user.u_name
        },
        secret,
        {
          expiresIn: "1h",
          issuer: "rucky",
          subject: "userInfo"
        }
      );
      res.cookie("token", token);
      res.json({
        message: "logged in successfully",
        token
      });
    } else {
      res.status(403).json({
        message: "login faild"
      });
    }
  } catch (err) {
    res.status(403).json({
      message: err.message
    });
  }
};

exports.check = async (req, res) => {
  res.json({
    success: true,
    info: req.decoded
  });
};
