/** Regenerate the local branded 1200×630 share image using Astro's installed sharp. */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const input = fileURLToPath(new URL('../../src/assets/j-sol-share.svg', import.meta.url));
const output = fileURLToPath(new URL('../../public/social/j-sol-share.png', import.meta.url));
mkdirSync(dirname(output), { recursive: true });
await sharp(input).png({ compressionLevel: 9 }).toFile(output);
console.log('Prepared public/social/j-sol-share.png (1200×630); no publication performed.');
