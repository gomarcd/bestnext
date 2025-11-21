import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const distDir = path.join(packageRoot, 'dist');

async function copyRecursive(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });

  // Copy static Drupal files.
  await copyRecursive(path.join(packageRoot, 'src'), distDir);

  const assetsDir = path.join(distDir, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.mkdir(path.join(assetsDir, 'css'), { recursive: true });
  await fs.mkdir(path.join(assetsDir, 'js'), { recursive: true });

  // Copy token CSS and JSON for Drupal consumption.
  const tokensPackage = path.resolve(packageRoot, '..', 'tokens');
  const tokensCss = path.join(tokensPackage, 'dist', 'css', 'tokens.css');
  const tokensJson = path.join(tokensPackage, 'dist', 'json', 'tokens.json');

  try {
    await fs.copyFile(tokensCss, path.join(assetsDir, 'css', 'tokens.css'));
    await fs.copyFile(tokensJson, path.join(distDir, 'token-map.json'));
  } catch (error) {
    console.warn('[drupal-bridge] Token assets not found. Run `pnpm --filter @virtual-ds/tokens build` first.');
  }

  const componentsPackage = path.resolve(packageRoot, '..', 'components');
  const componentsBundle = path.join(componentsPackage, 'dist', 'index.js');
  try {
    await fs.copyFile(componentsBundle, path.join(assetsDir, 'js', 'components.js'));
  } catch (error) {
    console.warn('[drupal-bridge] Component bundle not found. Run `pnpm --filter @virtual-ds/components build` first.');
  }

  // Generate tarball for Drupal distribution.
  const tarballPath = path.join(packageRoot, `virtual-ds-drupal-bridge.tar.gz`);
  try {
    execSync(`tar -czf ${tarballPath} -C ${distDir} .`);
    console.log(`[drupal-bridge] Created ${tarballPath}`);
  } catch (error) {
    console.warn('[drupal-bridge] Unable to create tarball (tar command missing?).');
  }
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
