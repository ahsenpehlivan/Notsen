const fs = require('fs');

async function downloadFont(url, path) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(path, Buffer.from(buffer));
        console.log(`Downloaded ${path}`);
    } catch (e) {
        console.error(`Failed to download ${path}:`, e.message);
    }
}

async function main() {
    await downloadFont('https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf', 'android/app/src/main/res/font/plus_jakarta_sans_variable.ttf');
    await downloadFont('https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bslnt%2Cwght%5D.ttf', 'android/app/src/main/res/font/inter_variable.ttf');
    await downloadFont('https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/OFL.txt', 'android/app/src/main/res/font/plus_jakarta_sans_OFL.txt');
    await downloadFont('https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt', 'android/app/src/main/res/font/inter_OFL.txt');
}
main();
