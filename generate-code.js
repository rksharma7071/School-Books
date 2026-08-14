const fs = require("fs");
const path = require("path");

const PROJECT_DIR = process.argv[2] || process.cwd();

const OUTPUT_FILE = path.join(PROJECT_DIR, "code.txt");

const IGNORE_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".vite",
    "coverage",
    ".cache",
    ".turbo",
]);

const IGNORE_FILES = new Set([
    "code.txt",
]);

const BINARY_EXTENSIONS = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".bmp",
    ".svg",

    ".mp3",
    ".wav",
    ".ogg",
    ".mp4",
    ".avi",
    ".mov",
    ".mkv",

    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",

    ".pdf",

    ".exe",
    ".dll",

    ".woff",
    ".woff2",
    ".ttf",
    ".otf",

    ".sqlite",
    ".db",
]);

const MAX_FILE_SIZE = 2 * 1024 * 1024;


function shouldIgnore(fileName, fullPath) {
    if (IGNORE_FILES.has(fileName)) {
        return true;
    }

    try {
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            return IGNORE_DIRS.has(fileName);
        }
    } catch {
        return true;
    }

    return false;
}


function isBinaryFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    return BINARY_EXTENSIONS.has(extension);
}


function generateStructure(directory, prefix = "") {
    let output = "";

    let items = fs.readdirSync(directory, {
        withFileTypes: true
    });

    items = items.filter(item => {
        const fullPath = path.join(directory, item.name);

        return !shouldIgnore(item.name, fullPath);
    });

    items.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) {
            return -1;
        }

        if (!a.isDirectory() && b.isDirectory()) {
            return 1;
        }

        return a.name.localeCompare(b.name);
    });

    items.forEach((item, index) => {
        const isLast = index === items.length - 1;

        const connector = isLast
            ? "└── "
            : "├── ";

        output += `${prefix}${connector}${item.name}\n`;

        if (item.isDirectory()) {
            const newPrefix = prefix + (
                isLast
                    ? "    "
                    : "│   "
            );

            output += generateStructure(
                path.join(directory, item.name),
                newPrefix
            );
        }
    });

    return output;
}


function getAllFiles(directory, files = []) {
    const items = fs.readdirSync(directory, {
        withFileTypes: true
    });

    for (const item of items) {
        const fullPath = path.join(directory, item.name);

        if (shouldIgnore(item.name, fullPath)) {
            continue;
        }

        if (item.isDirectory()) {
            getAllFiles(fullPath, files);
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

function generateCodeFile() {
    console.log("=================================");
    console.log("Generating project code...");
    console.log("=================================");

    console.log("\nProject:");
    console.log(PROJECT_DIR);

    console.log("\nGenerating folder structure...");

    const structure = generateStructure(PROJECT_DIR);

    console.log("Finding files...");

    const files = getAllFiles(PROJECT_DIR);

    console.log(`Found ${files.length} files.`);

    let output = "";

    output += "=============================================\n";
    output += "PROJECT FOLDER & FILE STRUCTURE\n";
    output += "=============================================\n\n";

    output += `Project: ${path.basename(PROJECT_DIR)}\n\n`;

    output += structure;

    output += "\n\n";

    output += "=============================================\n";
    output += "PROJECT FILE CODE\n";
    output += "=============================================\n\n";

    for (const filePath of files) {

        const relativePath = path.relative(
            PROJECT_DIR,
            filePath
        );

        output += "\n";
        output += "=============================================\n";
        output += `FILE: ${relativePath}\n`;
        output += "=============================================\n\n";

        if (isBinaryFile(filePath)) {

            output += "[Binary file - code not included]\n";

            continue;
        }

        const stats = fs.statSync(filePath);

        if (stats.size > MAX_FILE_SIZE) {

            output += "[File too large - code not included]\n";

            continue;
        }


        try {

            const content = fs.readFileSync(
                filePath,
                "utf8"
            );

            output += content;

            if (!content.endsWith("\n")) {
                output += "\n";
            }

        } catch (error) {

            output += `[Unable to read file: ${error.message}]\n`;
        }
    }

    fs.writeFileSync(
        OUTPUT_FILE,
        output,
        "utf8"
    );


    console.log("\n=================================");
    console.log("Completed successfully!");
    console.log("=================================");

    console.log(`\nOutput file: ${OUTPUT_FILE}`);
    console.log(`Files processed: ${files.length}`);
}

generateCodeFile();