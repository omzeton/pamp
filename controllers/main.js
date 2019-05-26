const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator/check");

exports.getSignup = (req, res, next) => {
  res.render("signup", {
    path: "/signup",
    pageTitle: "Signup page",
    errorMessage: "",
    oldInput: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: []
  });
};
exports.postSignup = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("signup", {
      path: "/signup",
      pageTitle: "Signup page",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword
    });
    await user.save();
    res.redirect("/login");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getLogin = (req, res, next) => {
  res.render("login", {
    path: "/login",
    pageTitle: "Login page",
    errorMessage: "",
    oldInput: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: []
  });
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("login", {
      path: "/login",
      pageTitle: "Login page",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(422).render("login", {
        path: "/login",
        pageTitle: "Login page",
        errorMessage: "Invalid email or password",
        oldInput: {
          email: email,
          password: password
        },
        validationErrors: []
      });
    }
    const doMatch = await bcrypt.compare(password, user.password);
    if (doMatch) {
      return res.redirect("/success");
    }
    return res.status(422).render("login", {
      path: "/login",
      pageTitle: "Login page",
      errorMessage: "Invalid email or password",
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: []
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    res.redirect("/login");
    return next(error);
  }
};

exports.getSuccess = (req, res, next) => {
  res.render("success", {
    path: "/success",
    pageTitle: "Success page"
  });
};

exports.getError = (req, res, next) => {
  res.render("error", {
    path: "/error",
    pageTitle: "Error!"
  });
};
