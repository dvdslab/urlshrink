require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// create schema
const URL = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: Number,
});
// create model
const URLModel = mongoose.model("URL", URL);

// connect to mongodb
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(port, function () {
      console.log(`Listening on port  ${port}`);
    });
  })
  .catch((error) => console.log(error));

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

let rest = {};
app.post("/api/shorturl", (req, res) => {
  let url = req.body.url;
  rest.original_url = url;

  let urlRegex = new RegExp(
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
  );

  if (!url.match(urlRegex)) {
    res.json({ error: "invalid URL" });
    return;
  }

  let short = 1;
  URLModel.findOne({})
    .sort({ short_url: -1 })
    .exec((err, result) => {
      if (!err && result != undefined) {
        short = result.short_url + 1;
      }
      if (!err) {
        URLModel.findOneAndUpdate(
          { original_url: url },
          { original_url: url, short_url: short },
          { new: true, upsert: true },
          (err, result) => {
            if (!err) {
              rest.short_url = result.short_url;
              res.json(rest);
            }
          }
        );
      }
    });
});

app.get("/:short", (req, res) => {
  let short = req.params.short;
  URLModel.findOne({ short_url: short }, (err, result) => {
    if (!err) {
      res.redirect(result.original_url);
    }
  });
});
