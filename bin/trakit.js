#!/usr/bin/env node

// ─── Core Modules ────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ─── UI Modules ──────────────────────────────────────────────
const chalk = require("chalk");
const boxen = require("boxen");
const Table = require("cli-table3");
const ora = require("ora");
const figures = require("figures");

// ─── CLI Setup ───────────────────────────────────────────────
const args = process.argv.slice(2);
const command = args[0];
const cwd = process.cwd();

// ─── UI Helper Object ───────────────────────────────────────
const ui = {
    // Green success message with tick icon
    success(msg) {
        console.log(chalk.green(`  ${figures.tick} ${msg}`));
    },

    // Red error message with cross icon
    error(msg) {
        console.log(chalk.red(`  ${figures.cross} ${msg}`));
    },

    // Blue info message with info icon
    info(msg) {
        console.log(chalk.blue(`  ${figures.info} ${msg}`));
    },

    // Warning message with warning icon
    warn(msg) {
        console.log(chalk.yellow(`  ${figures.warning} ${msg}`));
    },

    // Boxed output with customizable border color
    box(content, options = {}) {
        const defaults = {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: "round",
            borderColor: "green",
        };
        console.log(boxen(content, { ...defaults, ...options }));
    },

    // Create and return a cli-table3 instance
    table(head, colWidths) {
        return new Table({
            head: head.map((h) => chalk.cyan.bold(h)),
            colWidths: colWidths,
            style: { head: [], border: ["gray"] },
        });
    },

    // Shorthand to shorten a hash for display
    shortHash(hash) {
        return hash.substring(0, 7);
    },

    // Prominent title box for branding
    titleBox(title, tagline, version) {
        const content =
            chalk.bold.cyan(title) + chalk.gray("  v" + version) + "\n" +
            chalk.white(tagline);
        console.log(boxen(content, {
            padding: { top: 1, bottom: 1, left: 3, right: 3 },
            margin: { top: 1, bottom: 1 },
            borderStyle: "round",
            borderColor: "cyan",
        }));
    },

    // Large success box with next steps
    successBox(title, details, nextSteps) {
        let content = chalk.green.bold(`${figures.tick}  ${title}\n`);
        content += "\n";
        for (const [label, value] of details) {
            content += chalk.gray(label + "  ") + chalk.white(value) + "\n";
        }
        if (nextSteps && nextSteps.length > 0) {
            content += "\n" + chalk.cyan.bold("Next steps:\n");
            for (const step of nextSteps) {
                content += chalk.gray("  " + figures.pointerSmall + " ") + chalk.white(step) + "\n";
            }
        }
        console.log(boxen(content.trimEnd(), {
            padding: { top: 1, bottom: 1, left: 3, right: 3 },
            margin: { top: 1, bottom: 1 },
            borderStyle: "round",
            borderColor: "green",
        }));
    },

    // Command table for help screen
    commandTable(commands) {
        const table = new Table({
            head: [
                chalk.cyan.bold("COMMAND"),
                chalk.cyan.bold("DESCRIPTION"),
                chalk.cyan.bold("EXAMPLE"),
            ],
            colWidths: [20, 32, 30],
            style: { head: [], border: ["gray"] },
        });
        for (const [cmd, desc, example, important] of commands) {
            const cmdStr = important
                ? chalk.cyan.bold(cmd)
                : chalk.cyan(cmd);
            const descStr = important
                ? chalk.white.bold(desc)
                : chalk.white(desc);
            table.push([cmdStr, descStr, chalk.gray(example)]);
        }
        return table;
    },
};

// ─────────────────────────────────────────────────────────────
//  COMMAND: help
// ─────────────────────────────────────────────────────────────
if (command === "help" || !command) {
    // Branded title box
    ui.titleBox(
        "Trakit",
        "Lightweight Version Control System",
        "1.0.0"
    );

    // Command reference table with examples
    const commands = [
        ["init",           "Initialize a new repository",  "trakit init",              true],
        ["add .",          "Stage all files for commit",    "trakit add .",             false],
        ["commit <msg>",   "Create a commit with message",  'trakit commit "fix bug"',  true],
        ["log",            "Show commit history",           "trakit log",               false],
        ["revert <hash>",  "Restore files from a commit",   "trakit revert a1b2c3d",    false],
        ["help",           "Show this help message",        "trakit help",              false],
    ];

    const table = ui.commandTable(commands);
    console.log(table.toString());
    console.log("");

  
    process.exit(0);
}

// ─────────────────────────────────────────────────────────────
//  COMMAND: init
// ─────────────────────────────────────────────────────────────
if (command === "init") {
    const trakitPath = path.join(cwd, ".trakit");

    // Check if already initialized
    if (fs.existsSync(trakitPath)) {
        ui.box(
            chalk.yellow.bold(`${figures.warning}  Repository already exists\n\n`) +
                chalk.gray("Location:  ") + chalk.white(trakitPath) + "\n\n" +
                chalk.gray("Your repository is ready to use."),
            { borderColor: "yellow", padding: { top: 1, bottom: 1, left: 3, right: 3 } }
        );
        process.exit(0);
    }

    // Create folder structure
    fs.mkdirSync(trakitPath);
    fs.mkdirSync(path.join(trakitPath, "objects"));
    fs.mkdirSync(path.join(trakitPath, "commits"));
    fs.writeFileSync(path.join(trakitPath, "HEAD"), "");

    // Prominent success box with next steps
    ui.successBox(
        "Trakit Repository Initialized",
        [
            ["Location:", trakitPath],
        ],
        [
            chalk.cyan("trakit add .") + chalk.gray("               Stage your files"),
            chalk.cyan('trakit commit "first commit"') + chalk.gray("  Save a snapshot"),
            chalk.cyan("trakit log") + chalk.gray("                 View history"),
        ]
    );
}

// ─────────────────────────────────────────────────────────────
//  COMMAND: add .
// ─────────────────────────────────────────────────────────────
if (command === "add" && args[1] === ".") {
    const trakitPath = path.join(cwd, ".trakit");

    // Check if repo is initialized
    if (!fs.existsSync(trakitPath)) {
        ui.error("Not a trakit repository. Run " + chalk.cyan("trakit init") + " first.");
        return;
    }

    // Spinner while scanning files
    const spinner = ora({ text: "Scanning files...", color: "cyan" }).start();

    const files = getFilesInCurrentFolder();
    const index = [];

    // Load previous index to detect status
    const indexPath = path.join(trakitPath, "index.json");
    let previousIndex = {};
    if (fs.existsSync(indexPath)) {
        const prev = JSON.parse(fs.readFileSync(indexPath, "utf8"));
        for (const entry of prev) {
            previousIndex[entry.file] = entry.hash;
        }
    }

    // Counters for summary
    let newCount = 0;
    let modifiedCount = 0;
    let unchangedCount = 0;

    // Process each file
    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const content = fs.readFileSync(fileName, "utf8");
        const hash = calculateHash(content);

        storeObject(hash, content);
        index.push({ file: fileName, hash: hash });

        // Determine status
        if (!previousIndex[fileName]) {
            newCount++;
        } else if (previousIndex[fileName] !== hash) {
            modifiedCount++;
        } else {
            unchangedCount++;
        }
    }

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

    spinner.succeed(chalk.green("Files scanned successfully"));
    console.log("");

    // Build status table
    const table = ui.table(["STATUS", "FILE", "HASH"], [15, 30, 12]);

    for (const entry of index) {
        let status;
        if (!previousIndex[entry.file]) {
            status = chalk.green.bold("NEW");
        } else if (previousIndex[entry.file] !== entry.hash) {
            status = chalk.yellow.bold("MODIFIED");
        } else {
            status = chalk.gray("UNCHANGED");
        }

        table.push([status, chalk.white(entry.file), chalk.gray(ui.shortHash(entry.hash))]);
    }

    console.log(table.toString());
    console.log("");
    ui.success(`${files.length} files staged successfully (${chalk.green(newCount + " new")}, ${chalk.yellow(modifiedCount + " modified")}, ${chalk.gray(unchangedCount + " unchanged")})`);
    console.log("");
}

// ─────────────────────────────────────────────────────────────
//  COMMAND: commit
// ─────────────────────────────────────────────────────────────
if (command === "commit") {
    const trakitPath = path.join(cwd, ".trakit");
    const indexPath = path.join(trakitPath, "index.json");

    // Check if files are staged
    if (!fs.existsSync(indexPath)) {
        ui.error("Nothing to commit. Run " + chalk.cyan("trakit add .") + " first.");
        return;
    }

    const message = args.slice(1).join(" ") || "no message";
    const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    // Spinner while creating commit
    const spinner = ora({ text: "Creating commit...", color: "magenta" }).start();

    // Store commit data
    const commit = {
        message: message,
        time: new Date().toISOString(),
        files: indexData,
    };

    const commitHash = calculateHash(JSON.stringify(commit));

    fs.writeFileSync(
        path.join(trakitPath, "commits", commitHash + ".json"),
        JSON.stringify(commit, null, 2)
    );

    fs.writeFileSync(path.join(trakitPath, "HEAD"), commitHash);

    spinner.succeed(chalk.green("Commit created"));

    // Commit detail box
    const timestamp = new Date(commit.time).toLocaleString();
    ui.box(
        chalk.magenta.bold(`${figures.tick} Commit Saved\n\n`) +
            chalk.gray("Hash:    ") + chalk.cyan(ui.shortHash(commitHash)) + chalk.gray(` (${commitHash})\n`) +
            chalk.gray("Message: ") + chalk.white(message) + "\n" +
            chalk.gray("Date:    ") + chalk.white(timestamp) + "\n" +
            chalk.gray("Files:   ") + chalk.white(indexData.length + " file(s)"),
        { borderColor: "magenta" }
    );
}

// ─────────────────────────────────────────────────────────────
//  COMMAND: log
// ─────────────────────────────────────────────────────────────
if (command === "log") {
    const trakitPath = path.join(cwd, ".trakit");
    const commitsPath = path.join(trakitPath, "commits");

    // Check if commits directory exists
    if (!fs.existsSync(commitsPath)) {
        ui.info("No commits found.");
        return;
    }

    const files = fs.readdirSync(commitsPath);

    if (files.length === 0) {
        ui.info("No commits yet.");
        return;
    }

    // Read HEAD to highlight current commit
    const head = fs.readFileSync(path.join(trakitPath, "HEAD"), "utf8").trim();

    // Read all commits and sort newest first by timestamp
    const commits = [];
    for (let i = 0; i < files.length; i++) {
        const commitFile = files[i];
        const hash = commitFile.replace(".json", "");
        const commitData = JSON.parse(
            fs.readFileSync(path.join(commitsPath, commitFile), "utf8")
        );
        commits.push({ hash, ...commitData });
    }
    commits.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Title
    console.log("");
    console.log(chalk.bold.cyan(`  ${figures.pointerSmall} Commit History`));
    console.log("");

    // Build table
    const table = ui.table(["#", "HASH", "MESSAGE", "DATE"], [5, 12, 30, 22]);

    for (let i = 0; i < commits.length; i++) {
        const c = commits[i];
        const isHead = c.hash === head;
        const dateStr = new Date(c.time).toLocaleString();

        const id = isHead
            ? chalk.yellow.bold((i + 1).toString() + " " + figures.pointer)
            : chalk.gray((i + 1).toString());

        const hashStr = isHead
            ? chalk.yellow.bold(ui.shortHash(c.hash))
            : chalk.cyan(ui.shortHash(c.hash));

        const msgStr = isHead
            ? chalk.yellow.bold(c.message) + chalk.yellow(" (HEAD)")
            : chalk.white(c.message);

        const dateDisplay = isHead
            ? chalk.yellow(dateStr)
            : chalk.gray(dateStr);

        table.push([id, hashStr, msgStr, dateDisplay]);
    }

    console.log(table.toString());
    console.log("");
    ui.info(`${commits.length} commit(s) total`);
    console.log(chalk.gray("  Tip: Use the visible hash to revert, e.g. ") + chalk.cyan("trakit revert " + ui.shortHash(commits[0].hash)));
    console.log("");
}

// ─────────────────────────────────────────────────────────────
//  COMMAND: revert
// ─────────────────────────────────────────────────────────────
if (command === "revert") {
    const trakitPath = path.join(cwd, ".trakit");
    const commitsPath = path.join(trakitPath, "commits");
    const targetHash = args[1];

    // Check if hash is provided
    if (!targetHash) {
        ui.error("Please provide a commit hash.");
        return;
    }

    // Resolve full or short hash using the helper function
    let resolvedHash;
    try {
        resolvedHash = findCommitByHash(commitsPath, targetHash);
    } catch (e) {
        // Multiple commits matched the prefix — ambiguous
        ui.error("Ambiguous hash " + chalk.cyan(targetHash) + ". Please use a longer hash.");
        return;
    }

    // No commit matched the given hash/prefix
    if (!resolvedHash) {
        ui.error("Commit " + chalk.cyan(targetHash) + " not found.");
        return;
    }

    const commitFilePath = path.join(commitsPath, resolvedHash + ".json");

    // Warning box before reverting
    ui.box(
        chalk.yellow.bold(`${figures.warning} Warning\n\n`) +
            chalk.white("This will overwrite current files with the\n") +
            chalk.white("contents from commit ") + chalk.cyan(ui.shortHash(resolvedHash)) + chalk.white("."),
        { borderColor: "yellow" }
    );

    const commitData = JSON.parse(fs.readFileSync(commitFilePath, "utf8"));

    // Spinner while reverting
    const spinner = ora({ text: "Reverting files...", color: "yellow" }).start();

    let restoredCount = 0;

    for (let i = 0; i < commitData.files.length; i++) {
        const fileInfo = commitData.files[i];
        const objectPath = path.join(trakitPath, "objects", fileInfo.hash);

        if (!fs.existsSync(objectPath)) {
            spinner.stop();
            ui.warn("Missing object for file: " + chalk.white(fileInfo.file));
            spinner.start();
            continue;
        }

        const content = fs.readFileSync(objectPath, "utf8");
        fs.writeFileSync(fileInfo.file, content, "utf8");
        restoredCount++;
    }

    // Update HEAD with the full resolved hash
    fs.writeFileSync(path.join(trakitPath, "HEAD"), resolvedHash);

    spinner.succeed(chalk.green("Revert complete"));

    // Success box
    ui.box(
        chalk.green.bold(`${figures.tick} Revert Successful\n\n`) +
            chalk.gray("Commit: ") + chalk.cyan(ui.shortHash(resolvedHash)) + "\n" +
            chalk.gray("Files:  ") + chalk.white(restoredCount + " file(s) restored"),
        { borderColor: "green" }
    );
}

// ─────────────────────────────────────────────────────────────
//  CORE FUNCTIONS (unchanged logic)
// ─────────────────────────────────────────────────────────────

// Resolve a full or short hash to a commit filename
// Returns the full hash if exactly one match, null if none, throws if ambiguous
function findCommitByHash(commitsPath, inputHash) {
    // If the commits directory doesn't exist, no match
    if (!fs.existsSync(commitsPath)) return null;

    // Read all commit files and find those starting with the input hash
    const allFiles = fs.readdirSync(commitsPath);
    const matches = [];

    for (let i = 0; i < allFiles.length; i++) {
        const fileName = allFiles[i];
        const hash = fileName.replace(".json", "");

        // Check if the commit hash starts with the provided input
        if (hash.startsWith(inputHash)) {
            matches.push(hash);
        }
    }

    // No matches found
    if (matches.length === 0) return null;

    // Exactly one match — return the full hash
    if (matches.length === 1) return matches[0];

    // Multiple matches — ambiguous hash prefix
    throw new Error("AMBIGUOUS");
}

function calculateHash(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

function storeObject(hash, content) {
    const objectPath = path.join(cwd, ".trakit", "objects", hash);
    if (!fs.existsSync(objectPath)) {
        fs.writeFileSync(objectPath, content, "utf8");
    }
}

function getFilesInCurrentFolder() {
    const all = fs.readdirSync(cwd);
    const files = [];

    for (let i = 0; i < all.length; i++) {
        const name = all[i];
        if (name === ".trakit") continue;
        if (name === "node_modules") continue;
        if (name === ".git") continue;

        const fullPath = path.join(cwd, name);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
            files.push(name);
        }
    }

    return files;
}
