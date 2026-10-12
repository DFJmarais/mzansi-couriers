import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = "/home/ubuntu/webdev-static-assets/mzansi-couriers-logo-no-toyota-faithful.png";
const destination = "/home/ubuntu/mzansi-couriers/ios/App/App/public/mzansi-couriers-logo.jpg";

const input = await readFile(source);
const output = await sharp(input)
  .jpeg({ quality: 88, progressive: true, mozjpeg: true })
  .toBuffer();
await writeFile(destination, output);
console.log(`Wrote ${destination} (${output.length} bytes)`);
