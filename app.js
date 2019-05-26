const express = require("express");
const mongoose = require("mongoose");
const mainRoutes = require("./routes/main");
const path = require("path");
const bodyParser = require("body-parser");

// Session 1
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require('connect-flash');
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static(path.join(__dirname, "public")));

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
