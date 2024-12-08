const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const stream = require("stream");

const app = express();
const PORT = 9000;
const REPO_DIR = path.join(__dirname, "repo"); // Adjust your repository directory
app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded({ extended: true }));

app.get("/:repo.git/info/refs", (req, res) => {
  try {
    const repo = req.params.repo;
    const gitCmd = req.query.service;
    console.log(req.method);
    console.log(req.query.service);
    const repoLink = path.join(REPO_DIR, repo + ".git");
    console.log(repoLink);
    const gitProcess = spawn(gitCmd, [
      repoLink,
      "--http-backend-info-refs",
      "--stateless-rpc",
      "--advertise-refs",
    ]);

    // req.pipe(gitProcess.stdin);
    req.on("data", (data) => {
      console.log("Data: ", data.toString());
    });
    gitProcess.stdout.on("data", (data) => {
      console.log("Data: ", data.toString());
    });
    // 001f# service=git-receive-pack
    const appendTransform = new stream.Transform({
      transform(chunk, encoding, callback) {
        const originalData = chunk.toString();
        const customText = "001f# service=git-receive-pack\n0000";
        this.push(customText + originalData);
        callback();
      },
    });
    res.setHeader(
      "content-type",
      "application/x-git-receive-pack-advertisement"
    );
    req.pipe(gitProcess.stdin);
    res.status(200);
    gitProcess.stdout.pipe(appendTransform).pipe(res);
    gitProcess.stderr.pipe(process.stderr);

    gitProcess.on("error", (err) => {
      res.status(500).send("Git process error");
      console.log(`Git process error: ${err}`);
    });

    gitProcess.on("exit", (code) => {
      res.status(200).end();
      console.log(`\nGit process exited with code ${code}`);
    });
  } catch (error) {
    res.status(400).send("Error, please try again!");
    console.log("In error: ");
    console.log(error);
  }
});

// Handle the Git push operation (git-receive-pack)
app.post("/:repo.git/git-receive-pack", (req, res) => {
  try {
    const repo = req.params.repo;
    const gitCmd = "git-receive-pack";
    console.log(req.method, req.body);
    console.log(req.query.service);
    const repoLink = path.join(REPO_DIR, repo + ".git");
    console.log(repoLink);
    const gitProcess = spawn(gitCmd, [repoLink, "--stateless-rpc"]);
    // 001f# service=git-receive-pack
    // const appendTransform = new stream.Transform({
    //   transform(chunk, encoding, callback) {
    //     const originalData = chunk.toString();
    //     const customText = "001f# service=git-receive-pack\n0000";
    //     this.push(customText + originalData);
    //     callback();
    //   },
    // });
    req.on("data", (data) => {
      console.log("Data: ", data.toString());
    });
    gitProcess.stdout.on("data", (data) => {
      console.log("Data: ", data.toString());
    });
    res.status(200);
    res.setHeader(
      "content-type",
      "application/x-git-receive-pack-advertisement"
    );
    req.pipe(gitProcess.stdin);
    gitProcess.stdout.pipe(res);
    gitProcess.stderr.pipe(process.stderr);

    gitProcess.on("error", (err) => {
      res.status(500).send("Git process error");
      console.log(`Git process error: ${err}`);
    });

    gitProcess.on("exit", (code) => {
      res.status(200).end();
      console.log(`\nGit process exited with code ${code}`);
    });
  } catch (error) {
    res.status(400).send("Error, please try again!");
    console.log("In error: ");
    console.log(error);
  }
});

// Handle the Git fetch operation (git-upload-pack)
// app.all("/:repo.git/git-upload-pack", (req, res) => {
//   try {
//     const repo = req.params.repo;
//     const gitHttpBackend = "git"; // Adjust this if necessary
//     console.log(`Received Git fetch for /${repo}.git/git-upload-pack`);

//     const gitProcess = spawn(gitHttpBackend, ["http-backend"], {
//       env: {
//         ...process.env,
//         GIT_PROJECT_ROOT: REPO_DIR,
//         PATH_INFO: ` /${repo}.git/git-upload-pack`, // Git fetch operation
//       },
//       stdio: ["pipe", "pipe", "pipe"],
//     });

//     req.pipe(gitProcess.stdin);
//     gitProcess.stdout.pipe(res);
//     gitProcess.stderr.pipe(process.stderr);

//     gitProcess.on("error", (err) => {
//       res.status(500).send("Git process error");
//       console.log(`Git process error: ${err}`);
//     });

//     gitProcess.on("exit", (code) => {
//       console.log(`Git process exited with code ${code}`);
//     });
//   } catch (error) {
//     res.status(400).send("Error, please try again!");
//     console.log(error);
//   }
// });

app.listen(PORT, () => {
  console.log(`Server is listening to port ${PORT}`);
});
