import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const projectPath = process.cwd();
const outputFile = path.join(projectPath, "code.txt");


const ignoredFolders = [
 "node_modules",
 ".git",
 "dist",
 "build",
 ".next",
 ".cache",
 "coverage",
 ".vscode",
 ".idea",
 "logs",
 "tmp",
 "temp"
];


const ignoredFiles = [
 "code.txt",
 ".DS_Store",
 "package-lock.json",
 "yarn.lock",
 ".env",
 ".env.local",
 ".env.development",
 ".env.production"
];


const includeExtensions = [
 ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
 ".json", ".html", ".css", ".scss", ".sass",
 ".md", ".txt", ".yml", ".yaml", ".xml",
 ".svg", ".png", ".jpg", ".jpeg", ".gif"
];


function shouldIgnore(name, isDirectory) {
 if (isDirectory) {
   return ignoredFolders.includes(name);
 }


 if (ignoredFiles.includes(name)) {
   return true;
 }


 if (includeExtensions && !isDirectory) {
   const ext = path.extname(name);
   return !includeExtensions.includes(ext);
 }


 return false;
}


function generateTree(dir, prefix = "") {
 let result = "";


 const items = fs
   .readdirSync(dir, { withFileTypes: true })
   .filter(item => !shouldIgnore(item.name, item.isDirectory()))
   .sort((a, b) => {
     if (a.isDirectory() && !b.isDirectory()) return -1;
     if (!a.isDirectory() && b.isDirectory()) return 1;


     return a.name.localeCompare(b.name);
   });


 items.forEach((item, index) => {
   const isLast = index === items.length - 1;


   const connector = isLast ? "└── " : "├── ";
   const childPrefix = isLast ? "    " : "│   ";


   result += `${prefix}${connector}${item.name}\n`;


   if (item.isDirectory()) {
     result += generateTree(
       path.join(dir, item.name),
       prefix + childPrefix
     );
   }
 });


 return result;
}


function getAllFiles(dir) {
 let files = [];


 const items = fs
   .readdirSync(dir, { withFileTypes: true })
   .filter(item => !shouldIgnore(item.name, item.isDirectory()));


 for (const item of items) {
   const fullPath = path.join(dir, item.name);


   if (item.isDirectory()) {
     files = files.concat(getAllFiles(fullPath));
   } else {
     files.push(fullPath);
   }
 }


 return files;
}


function readFileContent(filePath) {
 try {
   const ext = path.extname(filePath);
  
   const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.ttf', '.woff', '.woff2'];
   if (binaryExtensions.includes(ext)) {
     return `[Binary file - not displayed]`;
   }


   return fs.readFileSync(filePath, "utf8");
 } catch (error) {
   return `[Unable to read file: ${error.message}]`;
 }
}


function generateCodeFile() {
 console.log("Scanning project...");


 let output = "";


 output += "========================================\n";
 output += "PROJECT STRUCTURE\n";
 output += "========================================\n\n";


 output += generateTree(projectPath);


 output += "\n\n";


 output += "========================================\n";
 output += "PROJECT FILES AND CODE\n";
 output += "========================================\n\n";


 const files = getAllFiles(projectPath);


 console.log(`Found ${files.length} files to process...`);


 files.forEach((filePath, index) => {
   const relativePath = path.relative(projectPath, filePath);
   const content = readFileContent(filePath);


   output += "\n";
   output += "========================================\n";
   output += `FILE ${index + 1}: ${relativePath}\n`;
   output += "========================================\n\n";


   output += content;


   output += "\n\n";
 });


 fs.writeFileSync(outputFile, output, "utf8");


 console.log("========================================");
 console.log("Done!");
 console.log(`Generated: ${outputFile}`);
 console.log(`Total files: ${files.length}`);
 console.log("========================================");
}

generateCodeFile();