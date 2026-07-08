const fs = require('fs');
const path = require('path');

function replaceFile(p, replacements) {
    let content = fs.readFileSync(p, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(p, content);
}

const NotsenBackground = 'android/app/src/main/java/com/notsen/core/designsystem/components/NotsenBackground.kt';
const ActivityLogBottomSheet = 'android/app/src/main/java/com/notsen/feature/boarddetail/ui/ActivityLogBottomSheet.kt';

// 1. In NotsenBackground.kt, extract colors out of drawBehind
let bgContent = fs.readFileSync(NotsenBackground, 'utf8');
bgContent = bgContent.replace('    Box(\n        modifier = modifier\n            .fillMaxSize()\n            .background(NotsenTheme.colors.bgPrimary)\n            .drawBehind {',
    '    val bgPrimary = NotsenTheme.colors.bgPrimary\n    val gradientCenter = NotsenTheme.colors.gradientCenter\n    val gradientBottom = NotsenTheme.colors.gradientBottom\n    Box(\n        modifier = modifier\n            .fillMaxSize()\n            .background(bgPrimary)\n            .drawBehind {');

bgContent = bgContent.replace('colors = listOf(NotsenTheme.colors.gradientCenter, Color.Transparent),', 'colors = listOf(gradientCenter, Color.Transparent),');
bgContent = bgContent.replace('colors = listOf(NotsenTheme.colors.gradientBottom, Color.Transparent),', 'colors = listOf(gradientBottom, Color.Transparent),');
fs.writeFileSync(NotsenBackground, bgContent);

// 2. Add import to ActivityLogBottomSheet
let sheetContent = fs.readFileSync(ActivityLogBottomSheet, 'utf8');
sheetContent = sheetContent.replace('import com.notsen.core.designsystem.NotsenTypography', 'import com.notsen.core.designsystem.NotsenTheme');
fs.writeFileSync(ActivityLogBottomSheet, sheetContent);

console.log("Fixed final issues!");
