var http = require("http");
var spawn = require("child_process").spawn;
var path = require("path");
var backend = require("git-http-backend");
var zlib = require("zlib");
const fs = require("fs");
const { Transform } = require("stream");

// const writeFile = fs.createWriteStream("./some.txt", { flags: "a" });
// const customStream = new Transform({
//   transform(chunk, encoding, callback) {
//     console.log("Received chunk:", chunk.toString());
//     this.push(chunk);
//     callback();
//   },
// });

var server = http.createServer(function (req, res) {
  var repo = req.url.split("/")[1];
  var dir = path.join(__dirname, "repo", repo);
  console.log(dir);
  console.log(req.url, req.method, req.headers["content-encoding"]);

  var reqStream =
    req.headers["content-encoding"] == "gzip"
      ? req.pipe(zlib.createGunzip())
      : req;
  // console.log(reqStream)

  reqStream
    .pipe(
      backend(req.url, function (err, service) {
        if (err) return res.end(err + "\n");
        // console.log(service);
        res.setHeader("content-type", service.type);
        console.log(service.action, service.cmd, repo, service.fields);
        console.log(service.args);
        var ps = spawn(service.cmd, service.args.concat(dir));
        ps.stdout.pipe(service.createStream()).pipe(ps.stdin);
      })
    )
    .pipe(res);
  console.log(res.getHeaders());
  // reqStream.on("readable", (data) => {
  //   console.log("Read: ",data);
  // });
  reqStream.on("data", (data) => {
    console.log("Data: ", data.toString());
  });
});
server.listen(9000, () => {
  console.log("Server Started");
});
