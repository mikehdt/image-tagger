// favicon-generator.js
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Define source and target directories
const sourceFile = path.join(__dirname, 'src', 'favicon.svg');
const appDir = path.join(__dirname, 'src', 'app');

// Create an array of sizes needed for different devices
const sizes = [16, 32, 48, 64, 96, 128, 196, 256, 512];

// Create promises array for all the operations
const promises = [];

// Function to convert SVG to PNG of various sizes
async function generateFavicons() {
  console.log('Generating favicons from SVG...');

  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(sourceFile);

    // Process each size
    for (const size of sizes) {
      const outputFile = path.join(publicDir, `favicon-${size}.png`);

      promises.push(
        sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toFile(outputFile)
          .then(() => console.log(`Created ${outputFile}`)),
      );
    }

    // Wait for all conversions to complete
    await Promise.all(promises);

    // Now use sharp to create the ICO file with multiple sizes
    console.log('Creating ICO file...');

    // Use the 16x16, 32x32, and 48x48 for the ICO
    const icoSizes = [16, 32, 48];
    const icoBuffers = await Promise.all(
      icoSizes.map((size) => {
        return sharp(svgBuffer).resize(size, size).png().toBuffer();
      }),
    );

    // We'll use the smallest size as the main favicon.ico
    const smallestPng = icoBuffers[0];
    fs.writeFileSync(path.join(appDir, 'favicon.ico'), smallestPng);
    console.log('Created favicon.ico in src/app directory');

    console.log('Favicon generation complete!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons();
