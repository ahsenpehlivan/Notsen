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
    if (filePath.endsWith('.kt')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // Match the broken powershell string:
        // 'NotsenTheme.colors.' +                             backgroundColor = NotsenColors.AccentSubtle,.Groups[1].Value.ToLower() +                             backgroundColor = NotsenColors.AccentSubtle,.Groups[2].Value
        
        // This is tricky to match with a single regex, so let's write a targeted replace function
        // We look for 'NotsenTheme.
        
        // NotsenColors.Xxx -> NotsenTheme.colors.xxx
        // NotsenTypography.Xxx -> NotsenTheme.typography.xxx
        
        // We can just extract the inner NotsenColors.Xxx from the broken string!
        // The broken string looks like:
        // 'NotsenTheme.colors.' \+ (.*?)(NotsenColors|NotsenTypography)\.([A-Z])([a-zA-Z]*)(.*?)\.Groups\[1\]\.Value\.ToLower\(\) \+ (.*?)(NotsenColors|NotsenTypography)\.([A-Z])([a-zA-Z]*)(.*?)\.Groups\[2\]\.Value
        
        // Let's use a simpler approach. Just match:
        // 'NotsenTheme.(colors|typography|spacing|shapes).' \+ .*?(NotsenColors|NotsenTypography|NotsenSpacing|NotsenShapes)\.([A-Za-z]+).*?\.Groups\[1\]\.Value\.ToLower\(\) \+ .*?\.Groups\[2\]\.Value
        
        // It's much simpler! The original line is actually preserved exactly before the `.Groups[1]`!
        // Wait, the original line string is:
        // backgroundColor = NotsenColors.AccentSubtle,
        // So the token `NotsenColors.AccentSubtle` is right there.
        // Let's just fix it by replacing the whole broken line with the corrected line.
        
        let lines = content.split('\n');
        let changed = false;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.includes('.Groups[1].Value.ToLower()') || line.includes('.Groups[')) {
                // Find what it originally had. The string before `.Groups` is the original line!
                let originalLineMatch = line.match(/(.*)'NotsenTheme\.(colors|typography|spacing|shapes)\.' \+ (.*?)(,\.Groups\[|\.Groups\[)/);
                if (originalLineMatch) {
                    let prefix = originalLineMatch[1]; // before NotsenColors
                    let originalStr = originalLineMatch[3]; // The original line content!
                    
                    // The original string is literally the entire line before replacement!
                    // Wait! It's the whole line! So we can just take the original string, and apply a proper Node.js replace to it!
                    let fixedLine = originalStr.replace(/NotsenColors\.([A-Z])([a-zA-Z]*)/g, (m, p1, p2) => 'NotsenTheme.colors.' + p1.toLowerCase() + p2)
                                              .replace(/NotsenTypography\.([A-Z])([a-zA-Z]*)/g, (m, p1, p2) => 'NotsenTheme.typography.' + p1.toLowerCase() + p2)
                                              .replace(/NotsenSpacing\.([a-zA-Z]+)/g, (m, p1) => 'NotsenTheme.spacing.' + p1)
                                              .replace(/NotsenShapes\.([a-zA-Z]+)/g, (m, p1) => 'NotsenTheme.shapes.' + p1);
                                              
                    lines[i] = fixedLine;
                    changed = true;
                }
            } else if (line.includes('NotsenColors.') || line.includes('NotsenTypography.') || line.includes('NotsenSpacing.') || line.includes('NotsenShapes.')) {
                // Also fix files that weren't broken but need the replacement!
                // Wait, if it's NotsenTheme.colors, it won't match NotsenColors.
                if (!filePath.includes('NotsenTheme.kt') && !filePath.includes('NotsenColors.kt') && !filePath.includes('NotsenTypography.kt') && !filePath.includes('NotsenSpacing.kt') && !filePath.includes('NotsenShapes.kt')) {
                     let fixedLine = line.replace(/NotsenColors\.([A-Z])([a-zA-Z]*)/g, (m, p1, p2) => 'NotsenTheme.colors.' + p1.toLowerCase() + p2)
                                              .replace(/NotsenTypography\.([A-Z])([a-zA-Z]*)/g, (m, p1, p2) => 'NotsenTheme.typography.' + p1.toLowerCase() + p2)
                                              .replace(/NotsenSpacing\.([a-zA-Z]+)/g, (m, p1) => 'NotsenTheme.spacing.' + p1)
                                              .replace(/NotsenShapes\.([a-zA-Z]+)/g, (m, p1) => 'NotsenTheme.shapes.' + p1);
                     if (fixedLine !== line) {
                         lines[i] = fixedLine;
                         changed = true;
                     }
                }
            }
        }
        
        if (changed) {
            fs.writeFileSync(filePath, lines.join('\n'));
            console.log("Fixed " + filePath);
        }
    }
});
