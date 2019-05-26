const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator/check");

const mainController = require("../controllers/main.js");
const User = require("../models/user");

router.get("/signup", mainController.getSignup);

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
    body(
      "password",
      "Password has to be at least 6 characters long."
    )
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
  mainController.postSignup
);

router.get("/login", mainController.getLogin);

router.post("/login", mainController.postLogin);

router.get("/success", mainController.getSuccess);

router.get("/error", mainController.getError);

module.exports = router;
