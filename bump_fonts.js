const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walk(dirPath, callback);
        } else {
            if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts') || dirPath.endsWith('.jsx') || dirPath.endsWith('.js')) {
                callback(dirPath);
            }
        }
    });
}

function bumpFontSizes(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
        .replace(/text-\[8px\]/g, 'text-[10px]')
        .replace(/text-\[9px\]/g, 'text-[11px]')
        .replace(/text-\[10px\]/g, 'text-[12px]')
        .replace(/text-\[11px\]/g, 'text-[13px]')
        // slightly darker colors for small text
        .replace(/text-gray-300/g, 'text-gray-400')
        .replace(/text-gray-400/g, 'text-gray-500');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

walk(path.join(__dirname, 'src'), bumpFontSizes);
console.log('Done replacing small font sizes and low contrast text colors.');
