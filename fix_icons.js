const fs = require('fs');

const replacements = [
    {
        file: 'android/app/src/main/java/com/notsen/feature/main/ui/MainScreen.kt',
        search: 'Icons.Default.Notes',
        replace: 'Icons.AutoMirrored.Filled.Notes'
    },
    {
        file: 'android/app/src/main/java/com/notsen/feature/main/ui/MainScreen.kt',
        search: 'Icons.Filled.Notes',
        replace: 'Icons.AutoMirrored.Filled.Notes'
    },
    {
        file: 'android/app/src/main/java/com/notsen/feature/quicknotes/ui/QuickNotesScreen.kt',
        search: 'Icons.Default.ArrowBack',
        replace: 'Icons.AutoMirrored.Filled.ArrowBack'
    },
    {
        file: 'android/app/src/main/java/com/notsen/feature/quicknotes/ui/QuickNotesScreen.kt',
        search: 'Icons.Filled.ArrowBack',
        replace: 'Icons.AutoMirrored.Filled.ArrowBack'
    },
    {
        file: 'android/app/src/main/java/com/notsen/feature/settings/ui/SettingsScreen.kt',
        search: 'Icons.Default.ArrowBack',
        replace: 'Icons.AutoMirrored.Filled.ArrowBack'
    },
    {
        file: 'android/app/src/main/java/com/notsen/feature/settings/ui/SettingsScreen.kt',
        search: 'Icons.Filled.ArrowBack',
        replace: 'Icons.AutoMirrored.Filled.ArrowBack'
    }
];

replacements.forEach(r => {
    if (fs.existsSync(r.file)) {
        let content = fs.readFileSync(r.file, 'utf8');
        content = content.replace('import androidx.compose.material.icons.filled.Notes', 'import androidx.compose.material.icons.automirrored.filled.Notes');
        content = content.replace('import androidx.compose.material.icons.filled.ArrowBack', 'import androidx.compose.material.icons.automirrored.filled.ArrowBack');
        
        // Let's globally replace them too just in case it doesn't match default vs filled.
        const reSearch = new RegExp(r.search.replace('.', '\\.'), 'g');
        content = content.replace(reSearch, r.replace);
        fs.writeFileSync(r.file, content);
    }
});
console.log("Fixed warnings!");
