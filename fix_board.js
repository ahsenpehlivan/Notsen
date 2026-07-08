const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'android/app/src/main/java/com/notsen/feature/boarddetail/ui/BoardDetailScreen.kt');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find where `fun ColumnContainer(` occurs
const c1 = lines.findIndex(l => l.includes('fun ColumnContainer('));
const c2 = lines.findIndex((l, i) => i > c1 && l.includes('fun ColumnContainer('));

if (c1 !== -1 && c2 !== -1) {
    // Both fun ColumnContainer exist.
    // The previous one starts with `@OptIn` which is at c1 - 2.
    // The second one starts at c2 - 2.
    lines.splice(c1 - 2, (c2 - 2) - (c1 - 2));
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log("Successfully removed the corrupted duplicate!");
} else {
    console.log("Could not find two ColumnContainers.");
}
