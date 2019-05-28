const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator/check");

const authController = require("../controllers/auth");
const mainController = require("../controllers/main");
const isAuth = require("../util/isAuth");
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
      .isString()
      .isLength({ min: 3 })
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

router.post("/logout", isAuth, authController.postLogout);

router.get("/success", authController.getSuccess);

router.get("/error", authController.getError);

router.get("/password-change", isAuth, authController.getChangePassword);

router.post(
  "/password-change",
  [
    body("password", "Password has to be at least 6 characters long.")
      .isLength({ min: 6 })
      .isAlphanumeric()
      .trim(),
    body("passwordRepeat")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords don't match.");
        }
        return true;
      })
  ],
  isAuth,
  authController.postChangePassword
);

router.get("/delete-user", isAuth, authController.getDeleteUser);

router.post("/delete-user", isAuth, authController.postDeleteUser);

// main

router.get("/", mainController.getIndex);

router.get("/home", isAuth, mainController.getHome);

router.get("/settings", isAuth, mainController.getSettings);

router.post(
  "/settings",
  [
    body("username", "Please enter a valid username")
      .isString()
      .isLength({ min: 1 })
      .trim()
  ],
  isAuth,
  mainController.postSettings
);

router.get("/upload", isAuth, mainController.getUpload);

router.post(
  "/upload",
  [
    body("description", "Please enter a valid description")
      .isString()
      .isLength({ min: 3, max: 400 })
      .trim()
  ],
  isAuth,
  mainController.postUpload
);

router.post("/delete/:postId", isAuth, mainController.postDelete);

router.post("/like/:postId", isAuth, mainController.postLike);

router.get("/edit/:postId", isAuth, mainController.getEdit);

router.post(
  "/edit/:postId",
  [
    body("description", "Please enter a valid description")
      .isString()
      .isLength({ min: 3, max: 400 })
      .trim()
  ],
  isAuth,
  mainController.postEdit
);

module.exports = router;
