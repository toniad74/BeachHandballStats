import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

const svg192 = readFileSync(join(iconsDir, 'icon-192.svg'));
const svg512 = readFileSync(join(iconsDir, 'icon-512.svg'));
const svgMaskable = readFileSync(join(iconsDir, 'icon-maskable.svg'));

await sharp(svg192).resize(192, 192).png().toFile(join(iconsDir, 'icon-192.png'));
console.log('✓ icon-192.png generated');

await sharp(svg512).resize(512, 512).png().toFile(join(iconsDir, 'icon-512.png'));
console.log('✓ icon-512.png generated');

await sharp(svgMaskable).resize(512, 512).png().toFile(join(iconsDir, 'icon-maskable.png'));
console.log('✓ icon-maskable.png generated');

console.log('Done! PNG icons generated in public/icons/');
