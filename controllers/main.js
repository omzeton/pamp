const User = require("../models/user");
const Post = require("../models/post");
const fileHelper = require("../util/deleteFile");
const { validationResult } = require("express-validator/check");

function getCurrentDate() {
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
  return today;
}

exports.getIndex = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.render("welcome", {
      path: "/",
      pageTitle: "Welcome to Pamp"
    });
  }
  return res.render("main/home", {
    path: "/home",
    pageTitle: "Pamp - Home",
    user: {
      name: user.username,
      registeredSince: user.registryDate,
      filesUploaded: user.uploaded
    }
  });
};

exports.getHome = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.render("welcome", {
      path: "/",
      pageTitle: "Welcome to Pamp"
    });
  }
  Post.find().then(allPosts => {
    return res.render("main/home", {
      path: "/home",
      pageTitle: "Pamp - Home",
      user: {
        name: req.user.username,
        registeredSince: req.user.registryDate,
        filesUploaded: req.user.uploaded,
        avatar: req.session.user.avatar
      },
      posts: allPosts
    });
  });
};

exports.getSettings = (req, res, next) => {
  res.render("main/settings", {
    path: "/settings",
    pageTitle: "Pamp - User settings",
    errorMessage: "",
    oldInput: {
      username: req.session.user.username
    },
    validationErrors: []
  });
};

exports.postSettings = (req, res, next) => {
  const newUsername = req.body.username;
  const image = req.file;
  const unlinkFile = req.session.user.avatar;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render("main/settings", {
      path: "/settings",
      pageTitle: "Pamp - User settings",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        username: req.session.user.username
      },
      validationErrors: errors.array()
    });
  }

  if (image && newUsername !== req.session.user.username) {
    const imageUrl = image.path.replace("\\", "/");
    User.findById(req.session.user._id)
      .then(user => {
        user.username = newUsername;
        req.session.user.username = newUsername;
        user.avatar = imageUrl;
        req.session.user.avatar = imageUrl;
        return user.save();
      })
      .then(() => {
        return Post.updateMany(
          {},
          { username: newUsername, avatarUrl: imageUrl }
        );
      })
      .then(() => {
        fileHelper.deleteFile(unlinkFile);
        return res.redirect("/home");
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  }
  if (!image && newUsername !== req.session.user.username) {
    User.findById(req.session.user._id)
      .then(user => {
        user.username = newUsername;
        req.session.user.username = newUsername;
        return user.save();
      })
      .then(() => {
        return Post.updateMany({}, { username: newUsername });
      })
      .then(() => {
        return res.redirect("/home");
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  }
  if (image && newUsername === req.session.user.username) {
    const imageUrl = image.path.replace("\\", "/");
    User.findOneAndUpdate(req.session.user._id)
      .then(user => {
        user.avatar = imageUrl;
        req.session.user.avatar = imageUrl;
        return user.save();
      })
      .then(() => {
        return Post.updateMany({}, { avatarUrl: imageUrl });
      })
      .then(() => {
        fileHelper.deleteFile(unlinkFile);
        return res.redirect("/home");
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  }
  if (!image && newUsername === req.session.user.username) {
    return res.render("main/settings", {
      path: "/settings",
      pageTitle: "Pamp - User settings",
      errorMessage: "No changes were made",
      oldInput: {
        username: req.session.user.username
      },
      validationErrors: []
    });
  }
};

exports.getUpload = (req, res, next) => {
  res.render("main/upload", {
    path: "/upload",
    pageTitle: "Pamp - Upload new image",
    errorMessage: "",
    oldInput: {
      title: "",
      description: ""
    },
    validationErrors: []
  });
};

exports.postUpload = (req, res, next) => {
  const image = req.file;
  const description = req.body.description;

  if (!image && image != undefined) {
    res.status(422).render("main/upload", {
      path: "/upload",
      pageTitle: "Pamp - Upload new image",
      errorMessage: "Attached file is not an image",
      oldInput: {
        title: title,
        description: description
      },
      validationErrors: []
    });
  } else {
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("main/upload", {
      path: "/upload",
      pageTitle: "Pamp - Upload new image",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        title: title,
        description: description
      },
      validationErrors: errors.array()
    });
  }

  const currentDate = getCurrentDate();

  const postPost = new Post({
    description: description,
    uploadDate: currentDate,
    username: req.session.user.username,
    userId: req.user
  });

  if (req.session.user.avatar) {
    postPost.avatarUrl = req.session.user.avatar;
  }

  if (image) {
    const imageUrl = image.path.replace("\\", "/");
    postPost.imageUrl = imageUrl;
  }

  const postUser = {
    postId: postPost._id,
    description: description
  };

  User.findById(req.session.user._id)
    .then(user => {
      user.posts.push(postUser);
      user.uploaded += 1;
      return user.save();
    })
    .then(() => {
      return postPost.save();
    })
    .then(() => {
      res.redirect("/home");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  const pushedPost = {};
};
