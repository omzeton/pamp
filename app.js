const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const mainRoutes = require("./routes/main");
const bodyParser = require("body-parser");
const multer = require("multer");
const uuidv4 = require('uuid/v4');

// Session 1
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const User = require("./models/user");
// ----

const MONGODB_URI =
  "mongodb+srv://adam:EcbTyHoVzEiBtR3m@cluster0-gkuip.mongodb.net/snl?retryWrites=true";

const app = express();
// Session 2
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions"
});
// ----
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Session 3
app.use(
  session({
    secret: "iloveuior",
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});
// ----

app.use(mainRoutes);

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    app.listen(3000);
    console.log("ተገናኝቷል");
  })
  .catch(error => {
    console.log(error);
  });
