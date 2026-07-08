const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'android/app/src/main/java/com/notsen/feature/boarddetail/ui/BoardDetailScreen.kt');
let content = fs.readFileSync(filePath, 'utf8');

// The file has two definitions of `fun ColumnContainer`.
const targetStr = '@OptIn(ExperimentalFoundationApi::class)\n@Composable\nfun ColumnContainer(';
const firstIndex = content.indexOf(targetStr);
const secondIndex = content.indexOf(targetStr, firstIndex + 1);

if (secondIndex !== -1) {
    // Cut out the duplicate.
    // The duplicated block starts around line 340. We need to preserve everything before the second `ColumnContainer` BUT we must make sure the braces match.
    // Wait, the duplicate block starts at `secondIndex`. Let's just remove everything from `secondIndex` to the end of `ColumnContainer`... 
    // Actually, look at the error log. The file has syntax errors at 362-367.
    // Let's just write the whole clean ColumnContainer directly!
    console.log("Removing everything from secondIndex...");
    content = content.substring(0, secondIndex);
    fs.writeFileSync(filePath, content);
}
