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
    ['colors = listOf(NotsenTheme.colors.gradientBottom, Color.Transparent)\n                        center =', 'colors = listOf(NotsenTheme.colors.gradientBottom, Color.Transparent),\n                        center =']
]);

// 2. GlassContainer.kt
replaceFile('android/app/src/main/java/com/notsen/core/ui/GlassContainer.kt', [
    ['backgroundColor: Color = NotsenTheme.colors.glassBg\n    borderColor: Color = NotsenTheme.colors.glassBorderSubtle\n    borderWidth', 'backgroundColor: Color = NotsenTheme.colors.glassBg,\n    borderColor: Color = NotsenTheme.colors.glassBorderSubtle,\n    borderWidth']
]);

// 3. ActivityLogBottomSheet.kt
replaceFile('android/app/src/main/java/com/notsen/feature/boarddetail/ui/ActivityLogBottomSheet.kt', [
    ['style = NotsenTypography.headlineMedium\n                modifier =', 'style = NotsenTheme.typography.headlineMedium,\n                modifier ='],
    ['style = NotsenTypography.labelLarge', 'style = NotsenTheme.typography.labelLarge'],
    ['style = NotsenTypography.labelSmall\n                            color = MaterialTheme.colorScheme.onSurfaceVariant', 'style = NotsenTheme.typography.labelSmall,\n                            color = NotsenTheme.colors.textSecondary']
]);

// 4. BoardDetailScreen.kt
replaceFile('android/app/src/main/java/com/notsen/feature/boarddetail/ui/BoardDetailScreen.kt', [
    ['title = { Text("Pano Detayı", style = NotsenTheme.typography.headlineMedium) }\n                    navigationIcon =', 'title = { Text("Pano Detayı", style = NotsenTheme.typography.headlineMedium) },\n                    navigationIcon =']
]);

console.log("Fixed files!");
