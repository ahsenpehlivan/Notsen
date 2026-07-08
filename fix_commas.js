const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'android/app/src/main/java/com/notsen/feature/boarddetail/ui/BoardDetailScreen.kt');
let content = fs.readFileSync(filePath, 'utf8');

// Fix missing commas in Text for error message
content = content.replace(/color = NotsenTheme\.colors\.danger\n(\s*)style = NotsenTheme\.typography\.bodyMedium\n(\s*)modifier = Modifier/g,
    'color = NotsenTheme.colors.danger,\n$1style = NotsenTheme.typography.bodyMedium,\n$2modifier = Modifier');

// Replace any remaining `color = NotsenTheme.colors...` followed by `\n` without comma if next line has `style =` or `modifier =`
content = content.replace(/color = NotsenTheme\.colors\.([a-zA-Z0-9_]+)\n(\s*)(style|modifier|maxLines) = /g, 'color = NotsenTheme.colors.$1,\n$2$3 = ');
content = content.replace(/style = NotsenTheme\.typography\.([a-zA-Z0-9_]+)\n(\s*)(color|modifier|maxLines) = /g, 'style = NotsenTheme.typography.$1,\n$2$3 = ');

fs.writeFileSync(filePath, content);
console.log("Fixed more commas");
