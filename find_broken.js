const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const dir = 'android/app/src/main/java/com/notsen';

walk(dir, function(filePath) {
    if (filePath.endsWith('.kt') && !filePath.includes('NotsenTheme.kt') && !filePath.includes('NotsenColors.kt') && !filePath.includes('NotsenTypography.kt') && !filePath.includes('NotsenSpacing.kt') && !filePath.includes('NotsenShapes.kt')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // Let's first clean up the broken powershell replacement
        // 'NotsenTheme.typography.' +                     style = NotsenTypography.labelSmall,.Groups[1].Value.ToLower() +                     style = NotsenTypography.labelSmall,.Groups[2].Value
        // We'll just replace NotsenColors.Xyz -> NotsenTheme.colors.xyz
        // But the broken files have weird stuff. Let's just fix the files manually since I know which ones they are.
        // Let me just search for '.Groups[' and print the files first.
        if (content.includes('.Groups[')) {
             console.log("Broken file: " + filePath);
        }
    }
});
