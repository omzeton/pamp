const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator/check");

const authController = require("../controllers/auth");
const mainController = require("../controllers/main");
const isAuth = require('../util/isAuth');
const User = require("../models/user");

router.get("/signup", authController.getSignup);

router.post(
  "/signup",
  [
    check("email", "Please enter a valid email.")
      .isEmail()
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(mailExists => {
          if (mailExists) {
            return Promise.reject("This email already exists.");
          }
        });
      }),
    body("username", "Invalid username")
      .isLength({ min: 1 })
      .trim(),
    body("password", "Password has to be at least 6 characters long.")
      .isLength({ min: 6 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords don't match.");
        }
        return true;
      })
  ],
  authController.postSignup
);

router.get("/login", authController.getLogin);

router.post("/login", authController.postLogin);

router.get("/success", authController.getSuccess);

router.get("/error", authController.getError);

// main

router.get("/", mainController.getIndex);

router.get("/home", isAuth, mainController.getHome);

module.exports = router;
