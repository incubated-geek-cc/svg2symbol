const express = require("express")
const app = express()
const router = express.Router()
const bodyParser = require("body-parser")
const favicon = require("serve-favicon")

const path = require("path")
const engine = require("consolidate")

const SVGSpriter = require("svg-sprite")
const inlineCss = require("inline-css")

const PORT = process.env.PORT || 5000;

var routes = express.Router();
routes.get("/", (req, res) => res.render("index.html"))

var api = express.Router();
api.options("/convert-to-symbol", function(req, res) {
  res.status(200).send();
}).post("/convert-to-symbol", function(req, res, next) {
  inlineCss(req.body.svgData, { 
    url: "/" 
  }).then(function(newSvgData) {
    req.body.svgData = newSvgData;
    next();
  })
  .catch(() => {
    next();
  });
}, function(req, res) {
  var spriter = new SVGSpriter({
    "log": "verbose",
    "mode": {
      "symbol": {
        "bust": false,
        "inline": true,
        "example": true
      }
    }
  });
  var name = `svg-${Math.random()}.svg`;
  spriter.add(`./${name}`, `${name}`, req.body.svgData);
  spriter.compile(function(error, result) {
    if (error) {
      res.status(503).send(error);
      return;
    }
    var data = result.symbol.sprite._contents.toString();
    data = data
      .replace(/></g, ">\n<")
      .replace(/id=""/g, "")
      .replace(/\s{2,}/gm, " ")
      .replace(/"(?:\s{1,})/gm, "\" ");
    res.type("json").status(200).send({
      symbol: data,
      input: req.body.svgData
    });
  });
});

app.use(express.static(path.join(__dirname, "public")))
.set("views", path.join(__dirname, "views"))
.engine("html", engine.mustache)
.set("view engine", "html")
.use(favicon(path.join(__dirname, "public", "img/favicon-32x32.png")))
.use(bodyParser.json())
.use(bodyParser.urlencoded({ extended: false }))
.use("/", routes)
.use("/api", api)
.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
}).use(function(err, req, res, next) {
  if (err || response.statusCode !== 200) {
    return res.status(500).json({ 
      type: "error", 
      message: (app.get("env") === "development") ? err.message : {}
    });
  }
}).listen(PORT, () => {
  console.log(`Svg2Symbol App is listening on port ${PORT}!`)
});