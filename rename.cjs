const fs = require('fs');
const path = require('path');

const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', '.vscode', '.idea'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(path.basename(file))) {
        results = results.concat(walk(file));
      }
    } else {
      const isEnv = path.basename(file).startsWith('.env');
      if (isEnv || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.md')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname));

let changesCount = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Replace Hyperbot -> Signalxbot
  newContent = newContent.replace(/Hyperbot/g, 'Signalxbot');
  // Replace HyperBot -> Signalxbot
  newContent = newContent.replace(/HyperBot/g, 'Signalxbot');
  // Replace hyperbot -> signalxbot
  newContent = newContent.replace(/hyperbot/g, 'signalxbot');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
    changesCount++;
  }
});

console.log(`Total files updated: ${changesCount}`);
