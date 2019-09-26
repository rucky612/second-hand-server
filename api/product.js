const _ = require("lodash");
const connection = require("../database");
const aws = require("../aws");

const regexOrEqual = key => (key === "p_category" ? "=" : "REGEXP");

const keyFix = key => {
  if (key === "p_category") {
    return "p_cg_id";
  } else if (key === "p_name") {
    return `binary(${key})`;
  }
  return key;
};

const getImgObj = async id => {
  const sql = "SELECT pi_name, pi_caption, pi_size, pi_create_by FROM Product";
  const photoSQL = `JOIN Photo ON Product.p_id = Photo.pi_p_id WHERE p_id = '${id}'`;
  try {
    const rows = await connection.query(`${sql} ${photoSQL}`);
    if (rows && rows.length !== 0) {
      return Promise.all(
        _.map(rows, async row => {
          let imgSrc = "";
          try {
            if (row.pi_name) {
              imgSrc = await aws.getUrl(row.pi_name);
            }
          } catch (err) {
            console.log(err);
          }
          return {
            src: imgSrc,
            id: row.pi_name,
            alt: row.pi_caption,
            size: row.pi_size,
            date: row.pi_create_by
          };
        })
      );
    }
    return null;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const setResRows = async rows =>
  Promise.all(
    _.map(rows, async obj => ({
      p_id: obj.p_id,
      p_name: obj.p_name,
      p_description: obj.p_description,
      p_price: obj.p_price,
      p_amount: obj.p_amount,
      p_status: obj.p_status,
      p_category: {
        label: obj.cg_name,
        value: obj.cg_id
      },
      p_image: await getImgObj(obj.p_id)
    }))
  );

const Photo = {
  POST: async (req, res) => {
    if (!req.files && req.query.id) {
      console.log("No file received");
      res.status(403).send("no image received");
    }
    try {
      const sql = `INSERT INTO Photo (pi_name, pi_size, pi_type, pi_caption, pi_index, pi_p_id) VALUES`;
      const insertStr = _.reduce(
        req.files,
        (sql, file, index) => {
          return `${sql} ('${file.key}', '${file.size}', '${file.contentType}', '${file.originalname}-caption', '${index}', '${req.query.id}'),`;
        },
        ""
      );
      const insertSQL = insertStr.substring(0, insertStr.lastIndexOf(","));
      const rows = await connection.query(`${sql} ${insertSQL}`);
      console.log("The Photo Post Method is : ", rows);
      res.send(rows);
    } catch (err) {
      console.log("Error while performing Photo Post.", err);
      res.status(403).send(err);
    }
  },
  DELETE: async (req, res) => {
    try {
      const getRows = req.body.rows;
      const rowString = getRows.map(row => `'${row.name}'`);
      const rowJoin = rowString.join(", ");
      const sql = `DELETE FROM Photo WHERE pi_caption IN (${rowJoin})`;
      getRows.forEach(row => {
        aws.deleteImg(row.key);
      });
      const rows = await connection.query(sql, req.body);
      console.log("The Delete Method is : ", rows);
      res.send(rows);
    } catch (err) {
      console.log("Error while performing Delete.", err);
      res.status(403).send(err);
    }
  }
};

const Get_One = async (req, res) => {
  try {
    const sql = "SELECT * FROM Product";
    const joinSql = "JOIN Category ON Product.p_cg_id = Category.cg_id";
    const rows = await connection.query(`${sql} ${joinSql} WHERE ?`, req.query);
    const product = [
      {
        p_amount: rows[0].p_amount,
        p_category: {
          label: rows[0].cg_name,
          value: rows[0].cg_id
        },
        p_description: rows[0].p_description,
        p_id: rows[0].p_id,
        p_name: rows[0].p_name,
        p_price: rows[0].p_price,
        p_status: rows[0].p_status,
        p_image: await getImgObj(rows[0].p_id)
      }
    ];
    console.log("The Get One Method is : ", product);
    res.send(product);
  } catch (err) {
    console.log("Error while performing Get One.", err);
    res.status(403).send(err);
  }
};

const Get = async (req, res) => {
  try {
    const { offset, limit, search, sorted } = req.query;
    const countSQL = "SELECT COUNT(*) FROM Product";
    const sql = "SELECT * FROM Product";
    const searchObj = search ? JSON.parse(search) : null;
    const sortedObj = sorted ? JSON.parse(sorted) : null;
    const searchStr =
      searchObj && !_.isEmpty(searchObj)
        ? _.reduce(
            _.mapValues(searchObj, v => v),
            (sql, value, key) =>
              value
                ? `${sql} ${keyFix(key)} ${regexOrEqual(key)} '${value}' AND`
                : sql,
            "WHERE"
          )
        : "";
    const sortedStr =
      sortedObj && !_.isEmpty(sortedObj)
        ? _.reduce(
            _.mapValues(sortedObj, v => v),
            (sql, value, key) => `${sql} ${key} ${value ? "DESC" : "ASC"},`,
            "ORDER BY"
          )
        : "";
    const searchSQL = searchStr.substring(0, searchStr.lastIndexOf(" AND"));
    const sortedOSQL = sortedStr.substring(0, sortedStr.lastIndexOf(","));
    const joinSql = "JOIN Category ON Product.p_cg_id = Category.cg_id";
    const limitSql = `LIMIT ${offset}, ${limit}`;
    const rows = await connection.query(
      `${sql} ${joinSql} ${searchSQL} ${sortedOSQL} ${limitSql}`
    );
    const count = await connection.query(`${countSQL} ${joinSql} ${searchSQL}`);
    const resRows = await setResRows(rows);
    console.log("resrows", resRows);
    res.send({ rows: resRows, count: count[0]["COUNT(*)"] });
  } catch (err) {
    console.log("Error while performing Get.", err);
    res.status(403).send(err);
  }
};

const Post = async (req, res) => {
  try {
    const sql = "INSERT INTO Product SET ?";
    const rows = await connection.query(sql, req.body);
    console.log("The Post Method is : ", rows);
    res.send(rows);
  } catch (err) {
    console.log("Error while performing Post.", err);
    res.status(403).send(err);
  }
};

const Put = async (req, res) => {
  try {
    const sql = `UPDATE Product SET ? WHERE p_id=?`;
    const queries = _.mapKeys(req.body, (val, key) =>
      key === "p_category" ? "p_cg_id" : key
    );
    const rows = await connection.query(sql, [queries, req.body.p_id]);
    console.log("The Put Method is : ", rows);
    res.send(rows);
  } catch (err) {
    console.log("Error while performing Put.", err);
    res.status(403).send(err);
  }
};

const Delete = async (req, res) => {
  try {
    const selectSQL =
      "SELECT pi_name FROM Product JOIN Photo ON Product.p_id = Photo.pi_p_id WHERE ? ";
    const deleteSQL = "DELETE FROM Product WHERE ?";
    const rows = await connection.query(selectSQL, req.body);
    rows.forEach(row => {
      aws.deleteImg(row.pi_name);
    });
    connection.query(deleteSQL, req.body);
    console.log("The Delete Method is : ", rows);
    res.send(rows);
  } catch (err) {
    console.log("Error while performing Delete.", err);
    res.status(403).send(err);
  }
};

exports.GET_ONE = Get_One;
exports.GET = Get;
exports.POST = Post;
exports.PUT = Put;
exports.DELETE = Delete;

exports.PHOTO = Photo;
