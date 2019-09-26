const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  const token =
    req.headers["x-access-token"] || req.query.token || req.body.token;
  if (!token) {
    console.log("not have token", token);
    return res.status(403).json({
      success: false,
      message: "not logged in"
    });
  }

  try {
    const decoded = await jwt.verify(token, req.app.get("jwt-secret"));
    req.decoded = decoded;
    next();
  } catch (e) {
    console.log("auth error", e);
    res.status(403).json({
      success: false,
      message: e.message
    });
  }
};

module.exports = authMiddleware;
