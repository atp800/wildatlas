import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for image optimization
const IMAGE_SIZES = [320, 640, 768, 1024, 1280];
const QUALITY = 80;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Function to optimize and resize images
async function optimizeImage(inputPath, outputDir, baseName, ext) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`Processing ${baseName}${ext}...`);
    
    // Generate WebP version at original size
    await image
      .webp({ quality: QUALITY })
      .toFile(path.join(outputDir, `${baseName}.webp`));
    
    // Generate responsive sizes for both WebP and original format
    for (const size of IMAGE_SIZES) {
      if (size < metadata.width) {
        // WebP version
        await image
          .resize(size, null, { withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(path.join(outputDir, `${baseName}-${size}w.webp`));
        
        // Original format version
        await image
          .resize(size, null, { withoutEnlargement: true })
          .jpeg({ quality: QUALITY })
          .toFile(path.join(outputDir, `${baseName}-${size}w${ext}`));
      }
    }
    
    console.log(`✓ Optimized ${baseName}${ext}`);
  } catch (error) {
    console.error(`Error processing ${baseName}${ext}:`, error);
  }
}

// Function to process all images in a directory
async function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await processDirectory(filePath);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      const ext = path.extname(file);
      const baseName = path.basename(file, ext);
      const outputDir = path.dirname(filePath);
      
      await optimizeImage(filePath, outputDir, baseName, ext);
    }
  }
}

// Main execution
async function main() {
  console.log('Starting image optimization...');
  
  try {
    await processDirectory(PUBLIC_DIR);
    console.log('✅ Image optimization complete!');
  } catch (error) {
    console.error('❌ Error during image optimization:', error);
    process.exit(1);
  }
}

// Run the main function
main();
