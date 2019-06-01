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

function imgSearch(pId) {
  const postId = pId;
  let orgImg, dontDelete, isShared;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        return next(new Error("Post not found"));
      }
      isShared = post.shared == true ? true : false;
      if (post.imageUrl) {
        return (orgImg = post.imageUrl);
      }
      return (orgImg = false);
    })
    .then(() => {
      return Post.find();
    })
    .then(allPosts => {
      for (let post of allPosts) {
        if (post.imageUrl) {
          if (orgImg.toString() === post.imageUrl.toString()) {
            dontDelete = true;
          }
        }
      }
    })
    .then(() => {
      return Post.findById(postId);
    })
    .then(post => {
      if (post.imageUrl && !dontDelete) {
        fileHelper.deleteFile(post.imageUrl);
      }
    })
    .then(() => {
      return Post.deleteOne({ _id: postId, userId: req.session.user._id })
    })
    .then(() => {
      return User.findById(req.user._id);
    })
    .then(user => {
      if (!isShared) {
        user.uploaded -= 1;
      }
      return user.save();
    })
    .then(() => {
      console.log("Post deleted!");
      res.redirect("/home");
    })
    .catch(err => {
      res.status(500).json({ message: "Deleting product failed." });
    });
}

exports.getIndex = (req, res, next) => {
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
        name: req.session.user.username,
        registeredSince: req.session.user.registryDate,
        filesUploaded: req.session.user.uploaded
      },
      posts: allPosts
    });
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
        avatar: req.session.user.avatar,
        id: req.session.user._id
      },
      posts: allPosts,
      scripts: "test.js"
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
  const firstTimeAvatar = req.session.user.avatar === "-" ? true : false;

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
          { userId: req.session.user._id },
          {
            username: newUsername,
            avatarUrl: imageUrl,
            sharedBy: { userName: newUsername }
          },
          err => {
            console.log("updating posts");
          }
        );
      })
      .then(() => {
        if (!firstTimeAvatar) {
          fileHelper.deleteFile(unlinkFile);
        }
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
        return Post.updateMany(
          { userId: req.session.user._id },
          { username: newUsername },
          err => {
            console.log("no posts found with this id!");
          }
        );
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
    User.findById(req.session.user._id)
      .then(user => {
        user.avatar = imageUrl;
        req.session.user.avatar = imageUrl;
        return user.save();
      })
      .then(() => {
        return Post.updateMany(
          { userId: req.session.user._id },
          { avatarUrl: imageUrl },
          err => {
            console.log("no posts found with this id!");
          }
        );
      })
      .then(() => {
        if (!firstTimeAvatar) {
          fileHelper.deleteFile(unlinkFile);
        }
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
    validationErrors: [],
    editing: false,
    scripts: "select.js"
  });
};

exports.postUpload = (req, res, next) => {
  const image = req.file;
  const description = req.body.description;

  if (!image && image != undefined) {
    return res.status(422).render("main/upload", {
      path: "/upload",
      pageTitle: "Pamp - Upload new image",
      errorMessage: "Attached file is not an image",
      oldInput: {
        description: description
      },
      validationErrors: [],
      editing: false
    });
  }

  if (!description && image) {
    fileHelper.deleteFile(image.path.replace("\\", "/"));
    return res.status(422).render("main/upload", {
      path: "/upload",
      pageTitle: "Pamp - Upload new image",
      errorMessage: "Please provide a description",
      oldInput: {
        description: description
      },
      validationErrors: [],
      editing: false
    });
  }

  if (!description) {
    return res.status(422).render("main/upload", {
      path: "/upload",
      pageTitle: "Pamp - Upload new image",
      errorMessage: "Please provide a description",
      oldInput: {
        description: description
      },
      validationErrors: [],
      editing: false
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("main/upload", {
      path: "/upload",
      pageTitle: "Pamp - Upload new image",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        description: description
      },
      validationErrors: errors.array(),
      editing: false
    });
  }

  const currentDate = getCurrentDate();

  const postPost = new Post({
    description: description,
    uploadDate: currentDate,
    username: req.session.user.username,
    userId: req.user,
    likes: 0,
    shared: false
  });

  if (req.session.user.avatar) {
    postPost.avatarUrl = req.session.user.avatar;
  }

  if (image) {
    const imageUrl = image.path.replace("\\", "/");
    postPost.imageUrl = imageUrl;
  }

  User.findById(req.session.user._id)
    .then(user => {
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
};

exports.postDelete = (req, res, next) => {
  const postId = req.params.postId;
  let orgImg, dontDelete, isShared;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        return next(new Error("Post not found"));
      }
      if (post.shared == true) {
        isShared = true;
      } else {
        isShared = false;
      }
      if (post.imageUrl) {
        return (orgImg = post.imageUrl);
      }
      return (orgImg = false);
    })
    .then(() => {
      return Post.find();
    })
    .then(allPosts => {
      for (let post of allPosts) {
        if (post.imageUrl) {
          if (orgImg.toString() === post.imageUrl.toString()) {
            dontDelete = true;
          }
        }
      }
    })
    .then(() => {
      return Post.findById(postId);
    })
    .then(post => {
      if (post.imageUrl && !dontDelete) {
        fileHelper.deleteFile(post.imageUrl);
      }
    })
    .then(() => {
      return Post.deleteOne({ _id: postId, userId: req.session.user._id })
    })
    .then(() => {
      return User.findById(req.user._id);
    })
    .then(user => {
      if (!isShared) {
        user.uploaded -= 1;
      }
      return user.save();
    })
    .then(() => {
      console.log("Post deleted!");
      res.redirect("/home");
    })
    .catch(err => {
      res.status(500).json({ message: "Deleting product failed." });
    });
};

exports.postLike = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        return next(new Error("Post not found"));
      }
      post.likes += 1;
      return post.save();
    })
    .then(() => {
      res.redirect("/home");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEdit = (req, res, next) => {
  const postId = req.params.postId;
  let oldDescription;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        return next(new Error("Post not found"));
      }
      oldDescription = post.description;
    })
    .then(() => {
      res.render("main/upload", {
        path: "/upload",
        pageTitle: "Pamp - Update your post",
        errorMessage: "",
        oldInput: {
          description: oldDescription
        },
        validationErrors: [],
        editing: true,
        postId: postId
      });
    });
};

exports.postEdit = (req, res, next) => {
  const postId = req.params.postId;
  const newDescription = req.body.description;
  const image = req.file;
  const keepImg = req.body.keepImg;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("main/upload", {
      path: "/upload",
      pageTitle: "Pamp - Update your post",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        description: newDescription
      },
      validationErrors: errors.array(),
      editing: true,
      postId: postId
    });
  }

  Post.findById(postId)
    .then(post => {
      if (keepImg.toString() === "false" && image) {
        const imageUrl = image.path.replace("\\", "/");
        if (post.imageUrl && post.imageUrl !== '') {
          fileHelper.deleteFile(post.imageUrl);
        }
        post.imageUrl = imageUrl;
        post.description = newDescription;
        return post.save();
      } else if (keepImg.toString() === "false" && !image) {
        res.render("main/upload", {
          path: "/upload",
          pageTitle: "Pamp - Update your post",
          errorMessage: "Please provide an image",
          oldInput: {
            description: newDescription
          },
          validationErrors: [],
          editing: true,
          postId: postId
        });
      } else if (keepImg.toString() === "true" && image) {
        fileHelper.deleteFile(image.path.replace("\\", "/"));
        res.render("main/upload", {
          path: "/upload",
          pageTitle: "Pamp - Update your post",
          errorMessage: "Please choose 'Change image' to upload new picture",
          oldInput: {
            description: newDescription
          },
          validationErrors: [],
          editing: true,
          postId: postId
        });
      } else if (keepImg.toString() === "delete") {
        post.imageUrl = undefined;
        return post.save();
      } else {
        post.description = newDescription;
        return post.save();
      }
    })
    .then(() => {
      return res.redirect("/home");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postShare = (req, res, next) => {
  const uId = req.session.user._id;
  const userName = req.session.user.username;
  const postId = req.params.postId;
  const avatar = req.session.user.avatar;

  Post.findById(postId)
    .then(post => {
      isUsingImg = post.imageUrl ? true : false;
      const sharedPost = new Post({
        description: post.description,
        imageUrl: post.imageUrl,
        uploadDate: getCurrentDate(),
        username: userName,
        avatarUrl: avatar,
        userId: uId,
        likes: 0,
        shared: true,
        sharingDetails: {
          postId: post._id,
          owner: post.username,
          uploadDate: post.uploadDate
        }
      });
      return sharedPost.save();
    })
    .then(() => {
      res.redirect("/home");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};