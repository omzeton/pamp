const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const fileHelper = require("../util/deleteFile");
const { validationResult } = require("express-validator/check");

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup page",
    errorMessage: "",
    oldInput: {
      email: "",
      username: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: []
  });
};
exports.postSignup = async (req, res, next) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;
  let minutes = today.getMinutes();
  let hours = today.getHours();

  let yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  today = dd + "/" + mm + "/" + yyyy + " - " + hours + ":" + minutes;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup page",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        username: username,
        password: password
      },
      validationErrors: errors.array()
    });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      username: username,
      registryDate: today,
      uploaded: 0,
      avatar: "-",
      posts: []
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
  res.render("auth/login", {
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
    return res.status(422).render("auth/login", {
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
      return res.status(422).render("auth/login", {
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
      req.session.isLoggedIn = true;
      req.session.user = user;
      return req.session.save(err => {
        res.redirect("/home");
      });
    }
    return res.status(422).render("auth/login", {
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

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    res.redirect("/");
  });
};

exports.getChangePassword = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Pamp - Reset your password",
    errorMessage: "",
    oldInput: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: []
  });
};

exports.postChangePassword = (req, res, next) => {
  const newPassword = req.body.password;
  let hashedPassword;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/reset", {
      path: "/reset",
      pageTitle: "Pamp - Reset your password",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        password: newPassword
      },
      validationErrors: errors.array()
    });
  }
  bcrypt
    .hash(newPassword, 12)
    .then(hashed => {
      return (hashedPassword = hashed);
    })
    .then(() => {
      return User.findById(req.session.user._id);
    })
    .then(user => {
      user.password = hashedPassword;
      req.session.user.password = hashedPassword;
      return user.save();
    })
    .then(() => {
      res.redirect("/");
    })
    .catch(err => {
      return res.status(422).render("auth/reset", {
        path: "/reset",
        pageTitle: "Pamp - Reset your password",
        errorMessage:
          "Something went wrong reseting your password. Try again later.",
        oldInput: {
          email: email,
          password: password
        },
        validationErrors: []
      });
    });
};

exports.getDeleteUser = (req, res, next) => {
  res.render("auth/delete-account", {
    path: "/delete-account",
    pageTitle: "Pamp - Delete user"
  });
};

exports.postDeleteUser = (req, res, next) => {
  const uId = req.session.user._id;
  let avatar;
  User.findByIdAndDelete(uId)
    .then(() => {
      return Post.find({ userId: uId });
    })
    .then(posts => {
      for (let p of posts) {
        if (p.imageUrl && p.shared == false) {
          fileHelper.deleteFile(p.imageUrl);
          if (p.avatarUrl) {
            avatar = p.avatarUrl;
          }
        }
      }
      if (avatar.toString() !== "-") {
        fileHelper.deleteFile(avatar);
      }
    })
    .then(() => {
      return Post.deleteMany({ userId: uId });
    })
    .then(() => {
      return req.session.destroy(err => {
      });
    })
    .then(() => {
      console.log('User account deleted.');
      res.redirect("/");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};