#!/usr/bin/env node

// fro file system
const fs = require("fs");
// for path
const path = require("path");
// for hashing 
const crypto = require("crypto");


// for to read terminal argument
const args = process.argv.slice(2);
const command = args[0];
// current working directory
const cwd = process.cwd();

if (command === "help" || !command) {
    console.log("");
    console.log("Trakit - A lightweight version control system");
    console.log("");
    console.log("Usage:");
    console.log("  trakit <command> [options]");
    console.log("");
    console.log("Commands:");
    console.log("  init           Initialize a new repository");
    console.log("  add .          Stage files for commit");
    console.log("  commit <msg>   Create a commit with message");
    console.log("  log            Show commit history");
    console.log("  revert <hash>  Restore files from a commit");
    console.log("  help           Show this help message");
    console.log("");
    process.exit(0);
}

if (command === "init") {
    // to create path
    const trakitPath = path.join(cwd, ".trakit");
    //check 
    if (fs.existsSync(trakitPath)) {
        console.log("Reinitialized existing trakit repository.");
        process.exit(0);
    }
    // create folder like .git
fs.mkdirSync(trakitPath);
fs.mkdirSync(path.join(trakitPath, "objects"));
fs.mkdirSync(path.join(trakitPath, "commits"));

fs.writeFileSync(
  path.join(trakitPath, "HEAD"),
  ""
);
console.log("Initialized empty trakit repository.");

    console.log("Initialized empty trakit repository.");
}

// add files in file by hash value
if (command === "add" && args[1] === ".") {
    const trakitPath = path.join(cwd, ".trakit");

    // check init 
    if (!fs.existsSync(trakitPath)) {
        console.log("Run 'trakit init' first.");
        return;
    }

    // get files
    const files = getFilesInCurrentFolder();
    const index = [];

    // iterate to all files
    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const content = fs.readFileSync(fileName, "utf8");
        const hash = calculateHash(content);
        // store content
        storeObject(hash, content);

        // store in index.json
        index.push({
            file: fileName,
            hash: hash
        });
    }

    fs.writeFileSync(
        path.join(trakitPath, "index.json"),
        JSON.stringify(index, null, 2)
    );

    console.log("Files added successfully.");
}

// to Commit changes with msg like git commit
if (command === "commit") {
    const trakitPath = path.join(cwd, ".trakit");
    const indexPath = path.join(trakitPath, "index.json");

    // check add .
    if (!fs.existsSync(indexPath)) {
        console.log("Nothing to commit. Run 'trakit add .' first.");
        return;
    }
// get commit msg
    const message = args.slice(1).join(" ") || "no message";
    const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    //store commit
    const commit = {
        message: message,
        time: new Date().toISOString(),
        files: indexData
    };

    const commitHash = calculateHash(JSON.stringify(commit));

    //add committed data with (msg,time and hash) in json format
    fs.writeFileSync(
        path.join(trakitPath, "commits", commitHash + ".json"),
        JSON.stringify(commit, null, 2)
    );

    fs.writeFileSync(
        path.join(trakitPath, "HEAD"),
        commitHash
    );

    console.log("Commit created:", commitHash);
}

// To display all commits
if (command === "log") {
    const trakitPath = path.join(cwd, ".trakit");
    const commitsPath = path.join(trakitPath, "commits");

    //check commis available / not
    if (!fs.existsSync(commitsPath)) {
        console.log("No commits found.");
        return;
    }

    const files = fs.readdirSync(commitsPath);

    if (files.length === 0) {
        console.log("No commits yet.");
        return;
    }

    // iterate over commits
    for (let i = 0; i < files.length; i++) {
        const commitFile = files[i];
        const commitData = JSON.parse(
            fs.readFileSync(path.join(commitsPath, commitFile), "utf8")
        );
// display each cmmit
        console.log("Commit:", commitFile.replace(".json", ""));
        console.log("Message:", commitData.message);
        console.log("Time:", commitData.time);
        console.log("-------------------------");
    }
}


// to Go to speacifir commit like git checkout
if (command === "revert") {
    const trakitPath = path.join(cwd, ".trakit");
    const commitsPath = path.join(trakitPath, "commits");
    // to read hash
    const targetHash = args[1];

    // check if provied or not
    if (!targetHash) {
        console.log("Please provide commit hash.");
        return;
    }

// to create path for hash in commits with json file
    const commitFilePath = path.join(commitsPath, targetHash + ".json");

    // check is there
    if (!fs.existsSync(commitFilePath)) {
        console.log("Commit not found.");
        return;
    }

    // to read commit file and conver into json text { msg :,time:,etc} 
    const commitData = JSON.parse(
        fs.readFileSync(commitFilePath, "utf8")
    );


    for (let i = 0; i < commitData.files.length; i++) {
        const fileInfo = commitData.files[i];
        const objectPath = path.join(
            trakitPath,
            "objects",
            fileInfo.hash
        );

     // check for perticular file int provided hash 
        if (!fs.existsSync(objectPath)) {
            console.log("Missing object for file:", fileInfo.file);
            continue;
        }

        const content = fs.readFileSync(objectPath, "utf8");
        fs.writeFileSync(fileInfo.file, content, "utf8");
    }

    // to update head
    fs.writeFileSync(
        path.join(trakitPath, "HEAD"),
        targetHash
    );

    console.log("Reverted to commit:", targetHash);
}


function calculateHash(content) {
    return crypto
    // use hashing
        .createHash("sha256")
        // hash content
        .update(content)
        // 
        .digest("hex");
}

// to store file containt
function storeObject(hash, content) {
    const objectPath = path.join(cwd, ".trakit", "objects", hash);

    // if already exists, do nothing
    if (!fs.existsSync(objectPath)) {
        fs.writeFileSync(objectPath, content, "utf8");
    }
}



//to add files in current older
function getFilesInCurrentFolder() {
    const all = fs.readdirSync(cwd);
    const files = [];

    for (let i = 0; i < all.length; i++) {
        const name = all[i];

        // ignore .trakit folder
        if (name === ".trakit") continue;

        const fullPath = path.join(cwd, name);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
            files.push(name);
        }
    }

    return files;
}
