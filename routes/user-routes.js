const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();
const { Users } = require("../models/user-model");
const secret = process.env.JWT_KEY;

router.post("/register", (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (password === undefined) {
      return res.status(500).send({ error: "Invalid Password" });
    }
    Users.findOne({ email: email }, (err, user) => {
      if (err) return res.status(500).send({ error: err });
      if (user) {
        res.status(400).send({ error: "Email Already Exists" });
      } else {
        const newUser = new Users({
          first_name: firstName,
          last_name: lastName,
          last_login: -1,
          email: email,
          password: password,
        });
        newUser.save((err) => {
          if (err) return res.status(500).send({ error: err });
          res.sendStatus(201);
        });
      }
    });
  } catch {
    return res.status(500).send({ error: "Invalid Request Body" });
  }
});

router.post("/login/:uid", (req, res) => {
  const user_id = req.params['uid'];
  Users.findById(user_id, (err, foundUser) => {
    if (err) return res.status(500).send({ error: err });
    if (foundUser) {
      const token = jwt.sign({ id: foundUser._id }, secret, {
          expiresIn: 86400 // 24 Hours
      });
      foundUser.last_login = Math.floor(Date.now() / 1000);
      foundUser.save((err) => {
          if (err) return res.status(500).send({ error: err });
          res.send({ info: foundUser.toJSON(), token: token });
      });
    } else {
      return res.status(404).send({ error: "No User Found" });
    }
  });
});

router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (password === undefined) {
      return res.status(400).send({ error: "Invalid Password" });
    }
    Users.findOne({ email: email }, (err, foundUser) => {
      if (err) return res.status(500).send({ error: err });
      if (foundUser) {
        foundUser.comparePassword(password, (compareErr, isMatch) => {
          if (compareErr) return res.status(500).send({ error: comareErr });
          if (isMatch) {
            const token = jwt.sign({ id: foundUser._id }, secret, {
                expiresIn: 86400 // 24 Hours
            });
            foundUser.last_login = Math.floor(Date.now() / 1000);
            foundUser.save((err) => {
                if (err) return res.status(500).send({ error: err });
                res.send({ info: foundUser.toJSON(), token: token });
            });
          } else {
            return res.status(401).send({ error: "Incorrect Password" });
          }
        });
      } else {
        return res.status(404).send({ error: "No User Found" });
      }
    });
  } catch {
    return res.status(400).send({ error: "Invalid Request Body" });
  }
});

//https://www.positronx.io/react-file-upload-tutorial-with-node-express-and-multer/

module.exports = router;