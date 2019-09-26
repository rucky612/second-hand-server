const connection = require("../database");

const Get = async (req, res) => {
  const sql = "SELECT u_name FROM User WHERE ?";
  try {
    const rows = await connection.query(sql, req.body);
    console.log("The solution is: ", rows);
    res.send(rows);
  } catch (e) {
    console.log("Error while performing Query.", e);
    res.status(403).send(e);
  }
};

const Post = async (req, res) => {
  const sql = "INSERT INTO User SET ?";
  try {
    const rows = await connection.query(sql, req.body);
    console.log("The solution is: ", rows);
    res.send(rows);
  } catch (e) {
    console.log("Error while performing Query.", e);
    res.status(403).send(e);
  }
};

const Delete = (req, res) => {
  const sql = "DELETE FROM User WHERE u_name=?";
  const query = connection.query(sql, req.body);
  query
    .on("error", function(err) {
      res.status(400).send(err);
    })
    .on("fields", function(fields) {
      console.log(fields);
    })
    .on("result", function(row) {
      console.log(row);
      connection.pause();
    })
    .on("end", function() {});
};

exports.GET = Get;
exports.POST = Post;
exports.DELETE = Delete;
