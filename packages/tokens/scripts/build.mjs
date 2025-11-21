import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import StyleDictionary from 'style-dictionary';

const themes = ['light', 'dark'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

process.chdir(packageRoot);

const distDir = path.join(packageRoot, 'dist');
await fs.rm(distDir, { recursive: true, force: true });
const ensureDirs = ['css', 'scss', 'json', 'ts'];
for (const dir of ensureDirs) {
  await fs.mkdir(path.join(distDir, dir), { recursive: true });
}

const themeData = {};

for (const theme of themes) {
  const dictionary = StyleDictionary.extend({
    source: ['src/base/**/*.json', `src/themes/${theme}.json`],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'dist/css/',
        files: [
          {
            destination: `tokens.${theme}.css`,
            format: 'css/variables',
            options: {
              selector: theme === 'light' ? ':root' : `:root[data-theme="${theme}"]`
            }
          }
        ]
      },
      scss: {
        transformGroup: 'scss',
        buildPath: 'dist/scss/',
        files: [
          {
            destination: `_tokens.${theme}.scss`,
            format: 'scss/variables'
          }
        ]
      },
      json: {
        transformGroup: 'js',
        buildPath: 'dist/json/',
        files: [
          {
            destination: `tokens.${theme}.json`,
            format: 'json/nested'
          }
        ]
      }
    }
  });

  dictionary.buildPlatform('css');
  dictionary.buildPlatform('scss');
  dictionary.buildPlatform('json');

  const jsonPath = path.join(distDir, 'json', `tokens.${theme}.json`);
  const jsonContents = await fs.readFile(jsonPath, 'utf8');
  themeData[theme] = JSON.parse(jsonContents);
}

// Aggregate CSS output
const cssCombinedPath = path.join(distDir, 'css', 'tokens.css');
const cssPieces = [];
for (const theme of themes) {
  const filePath = path.join(distDir, 'css', `tokens.${theme}.css`);
  const content = await fs.readFile(filePath, 'utf8');
  cssPieces.push(content.trim());
}
await fs.writeFile(cssCombinedPath, cssPieces.join('\n\n'));

// Aggregate JSON output
const aggregatedJsonPath = path.join(distDir, 'json', 'tokens.json');
await fs.writeFile(aggregatedJsonPath, JSON.stringify(themeData, null, 2));

// Generate SCSS index that forwards partials with prefixes
const scssIndex = `@forward './tokens.light' as light-*;\n@forward './tokens.dark' as dark-*;\n`;
await fs.writeFile(path.join(distDir, 'scss', '_index.scss'), scssIndex);

// Generate JS + type definitions
const tokenThemes = `['${themes.join("', '")}']`;
const jsHelper = `function traverseTokens(theme, path) {\n  const segments = path.split('.');\n  let current = tokens[theme];\n  for (const segment of segments) {\n    if (typeof current !== 'object' || current === null || !(segment in current)) {\n      throw new Error('Token path "' + path + '" not found for theme "' + theme + '"');\n    }\n    current = current[segment];\n  }\n  if (typeof current !== 'string') {\n    return String(current);\n  }\n  return current;\n}\n`;
const jsContents = `export const tokenThemes = ${tokenThemes};\nexport const tokens = ${JSON.stringify(themeData, null, 2)};\nexport function getToken(theme, path) {\n  if (!tokenThemes.includes(theme)) {\n    throw new Error('Unknown token theme: ' + theme);\n  }\n  return traverseTokens(theme, path);\n}\n${jsHelper}export default tokens;\n`;
await fs.writeFile(path.join(distDir, 'index.js'), jsContents);

const dtsContents = `export const tokenThemes: ReadonlyArray<'${themes.join("' | '")}'>;\nexport type TokenTheme = typeof tokenThemes[number];\nexport type TokenDictionary = Record<string, any>;\nexport const tokens: Record<TokenTheme, TokenDictionary>;\nexport function getToken(theme: TokenTheme, path: string): string;\nexport default tokens;\n`;
await fs.writeFile(path.join(distDir, 'index.d.ts'), dtsContents);

const tsContents = `export const tokenThemes = ${tokenThemes} as const;\nexport type TokenTheme = typeof tokenThemes[number];\nexport const tokens = ${JSON.stringify(themeData, null, 2)} as const;\nexport type TokenDictionary = typeof tokens[keyof typeof tokens];\nexport function getToken(theme: TokenTheme, path: string): string {\n  if (!tokenThemes.includes(theme)) {\n    throw new Error('Unknown token theme: ' + theme);\n  }\n  const segments = path.split('.');\n  let current: any = tokens[theme];\n  for (const segment of segments) {\n    if (current == null || !(segment in current)) {\n      throw new Error('Token path "' + path + '" not found for theme "' + theme + '"');\n    }\n    current = current[segment as keyof typeof current];\n  }\n  return typeof current === 'string' ? current : String(current);\n}\nexport default tokens;\n`;
await fs.writeFile(path.join(distDir, 'ts', 'index.ts'), tsContents);
