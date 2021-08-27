const { Users } = require("../models/user-model");

exports.validateUserID = (req, res, next) => {
  const user_id = req.user_id;
  if (user_id === undefined) {
    return res.status(500).send({ error: "Invalid Request Body" });
  }
  Users.findOne({ _id: user_id }, (err, foundUser) => {
    if (err) return res.status(500).send({ error: err });
    if (foundUser) {
      next();
    } else {
      return res.status(404).send({ error: "User_id Not Found" });
    }
  });
};
