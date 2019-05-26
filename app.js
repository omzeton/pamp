const express = require("express");
const mongoose = require("mongoose");
const mainRoutes = require("./routes/main");
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const MONGODB_URI =
  "mongodb+srv://adam:EcbTyHoVzEiBtR3m@cluster0-gkuip.mongodb.net/snl?retryWrites=true";

app.set("view engine", "ejs");
app.set("views", "views");
app.use(mainRoutes);

app.use(express.static(path.join(__dirname, 'public')));

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    app.listen(3000);
    console.log("ተገናኝቷል");
  })
  .catch(error => {
    console.log(error);
  });
