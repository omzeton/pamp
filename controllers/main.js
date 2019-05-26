const User = require("../models/user");

exports.getIndex = (req, res, next) => {
  res.render("welcome", {
    path: "/",
    pageTitle: "Welcome to Pamp"
  });
};

exports.getHome = (req, res, next) => {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth() + 1;

  let yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  today = dd + "/" + mm + "/" + yyyy;

  User.findById(req.session.user._id).then(user => {
    res.render("main/home", {
      path: "/home",
      pageTitle: "Pamp - Home",
      user: {
        name: user.username,
        registeredSince: user.registryDate,
        filesUploaded: user.uploaded
      }
    });
  });
};
