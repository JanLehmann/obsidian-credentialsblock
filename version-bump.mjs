import { readFileSync, writeFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const manifestJson = JSON.parse(readFileSync('manifest.json', 'utf8'));

const oldVersion = packageJson.version;
const [major, minor, patch] = oldVersion.split('.').map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

packageJson.version = newVersion;
manifestJson.version = newVersion;

writeFileSync('package.json', JSON.stringify(packageJson, null, '\t') + '\n');
writeFileSync('manifest.json', JSON.stringify(manifestJson, null, '\t') + '\n');

// Also update versions.json if it exists
try {
    const versionsJson = JSON.parse(readFileSync('versions.json', 'utf8'));
    versionsJson[newVersion] = manifestJson.minAppVersion;
    writeFileSync('versions.json', JSON.stringify(versionsJson, null, '\t') + '\n');
} catch (e) {
    // If it doesn't exist, create it
    const versionsJson = { [newVersion]: manifestJson.minAppVersion };
    writeFileSync('versions.json', JSON.stringify(versionsJson, null, '\t') + '\n');
}

console.log(`Bumped version from ${oldVersion} to ${newVersion}`);
