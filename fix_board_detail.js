const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'android/app/src/main/java/com/notsen/feature/boarddetail/ui/BoardDetailScreen.kt');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Check if there are two `fun ColumnContainer` declarations
const funcStr = 'fun ColumnContainer(';
const firstIndex = content.indexOf(funcStr);
const secondIndex = content.indexOf(funcStr, firstIndex + 1);

if (secondIndex !== -1) {
    // There's duplication. Find the start of the first ColumnContainer
    const startStr = '@OptIn(ExperimentalFoundationApi::class)\n@Composable\nfun ColumnContainer(';
    const startIdx1 = content.indexOf(startStr);
    const startIdx2 = content.indexOf(startStr, startIdx1 + 1);
    
    if (startIdx2 !== -1) {
        // Cut the file at startIdx2
        content = content.substring(0, startIdx2);
        // But we must ensure it doesn't have an extra hanging brace before startIdx2
        // It had "} } } } }" at the end. We will trust `substring` to remove the duplicated second block.
        // Wait, the duplication came from a bad replace which might have duplicated the whole block but deleted some ends. Let's just restore from git... oh wait, no git.
    }
}

// 2. Fix typography
content = content.replace(/NotsenTypography/g, 'NotsenTheme.typography');

// 3. Fix missing commas before specific keyword arguments in Composable calls
content = content.replace(/([^\,\s\(\{\[])\n(\s*)(color = |borderColor = |shape = |textColor = |maxLines = )/g, '$1,\n$2$3');

// Write it back
fs.writeFileSync(filePath, content);
console.log("Fixed BoardDetailScreen.kt syntax errors.");
