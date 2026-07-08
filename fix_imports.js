const fs = require('fs');
const path = require('path');

function replaceFile(p, replacements) {
    let content = fs.readFileSync(p, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(p, content);
}

// 1. NotsenBackground.kt
replaceFile('android/app/src/main/java/com/notsen/core/designsystem/components/NotsenBackground.kt', [
    ['colors = listOf(NotsenTheme.colors.gradientCenter, Color.Transparent)\n                        center =', 'colors = listOf(NotsenTheme.colors.gradientCenter, Color.Transparent),\n                        center ='],
    ['import com.notsen.core.designsystem.NotsenColors', 'import com.notsen.core.designsystem.NotsenColors\nimport com.notsen.core.designsystem.theme.NotsenTheme']
]);

// 2. GlassContainer.kt
replaceFile('android/app/src/main/java/com/notsen/core/ui/GlassContainer.kt', [
    ['import com.notsen.core.designsystem.NotsenColors', 'import com.notsen.core.designsystem.NotsenColors\nimport com.notsen.core.designsystem.theme.NotsenTheme']
]);

// 3. ActivityLogBottomSheet.kt
replaceFile('android/app/src/main/java/com/notsen/feature/boarddetail/ui/ActivityLogBottomSheet.kt', [
    ['package com.notsen.feature.boarddetail.ui\n', 'package com.notsen.feature.boarddetail.ui\n\nimport com.notsen.core.designsystem.theme.NotsenTheme\n']
]);

console.log("Fixed missing imports and commas!");
