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
const GlassContainer = 'android/app/src/main/java/com/notsen/core/ui/GlassContainer.kt';
const ActivityLogBottomSheet = 'android/app/src/main/java/com/notsen/feature/boarddetail/ui/ActivityLogBottomSheet.kt';

replaceFile(NotsenBackground, [
    ['import com.notsen.core.designsystem.theme.NotsenTheme', 'import com.notsen.core.designsystem.NotsenTheme']
]);

replaceFile(GlassContainer, [
    ['import com.notsen.core.designsystem.theme.NotsenTheme', 'import com.notsen.core.designsystem.NotsenTheme']
]);

replaceFile(ActivityLogBottomSheet, [
    ['import com.notsen.core.designsystem.theme.NotsenTheme', 'import com.notsen.core.designsystem.NotsenTheme']
]);

console.log("Fixed imports!");
