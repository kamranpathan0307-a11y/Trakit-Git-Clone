Trakit 

Version License Node.js

Trakit  is a lightweight, human-friendly version control system designed for simplicity and speed. It brings the power of snapshots to your projects without the complexity of traditional tools.

✨ Features
🚀 Instant Snapshots: Quickly save the state of your project.
🔍 Simple History: View your project's evolution with a clear, readable log.
⏪ Easy Reverts: Accidentally broke something? Revert to any previous state in seconds.
🛡️ Smart Ignoring: Keep your repository clean with .Trakit ignore support.
🎨 Beautiful UI: Rich terminal interface with progress indicators and formatted tables.
🛠️ Installation
Trakit  is a Node.js-based CLI tool. To use it globally, you can link it locally or install dependencies and run it directly.

# Clone the repository
git clone https://github.com/KamranPathan03/Trakit-Git-Clone.git

# Navigate to the directory
cd Trakit 

# Install dependencies
npm install

# (Optional) Link the command globally
npm link
🚀 Quick Start
Get up and running with Trakit  in three simple steps:

Initialize your repository:

Trakit  init
Stage your changes:

Trakit  add .
Commit your snapshot:

Trakit  commit "Initial snapshot of my project"
📖 Command Reference
Command	Description	Example
init	Initialize a new Trakit  repository in the current directory.	Trakit  init
add .	Scan for changes and stage them for the next commit.	Trakit  add .
commit	Save the staged changes with a descriptive message.	Trakit  commit "feat: add login ui"
log	Display a detailed table of all snapshots in history.	Trakit  log
revert	Restore all project files to a specific snapshot hash.	Trakit  revert a1b2c3d4
help	Show the built-in help documentation.	Trakit  help
⚙️ Configuration
.Trakit ignore
Create a .Trakit ignore file in your root directory to exclude specific files or folders from being tracked.

Note: Trakit  automatically ignores .Trakit /, .Trakit ignore, node_modules/, and .git/ by default.

Example .Trakit ignore:

*.log
temp/
docs/drafts/
secret.txt
💡 Pro Tips
🌟 Use Trakit  log to find the unique hash of any previous version.
🌟 You don't need the full hash! You can use partial hashes (e.g., the first 8 characters) with the revert command.
🌟 Trakit 's internals are inspired by Git. Your file contents are safely stored as objects in the .Trakit /objects directory.
🧠 How It Works
Trakit  uses a content-addressable storage system located in the .Trakit  directory:

objects/: Stores compressed/hashed versions of your file contents.
commits/: Stores metadata for each snapshot (message, date, file references).
index.json: Tracks the current staged state of your repository.
HEAD: Points to the most recent snapshot.
📄 License
This project is licensed under the ISC License. See the package.json for details.

Made with ❤️ for developers who love simplicity.