import fs from "fs";
import path from "path";
import sharp from "sharp";

const IMAGES_DIR = path.resolve("public/images");
const BACKUP_DIR = path.resolve("image-backups");

async function getAllFiles(dir) {
  let results = [];
  const list = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await getAllFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

async function main() {
  console.log("=== MARRIGOLD IMAGE OPTIMIZER ===");
  console.log(`Source directory: ${IMAGES_DIR}`);
  console.log(`Backup directory: ${BACKUP_DIR}`);

  const files = await getAllFiles(IMAGES_DIR);
  console.log(`Found ${files.length} images to process.\n`);

  // Ensure backup folder exists
  await fs.promises.mkdir(BACKUP_DIR, { recursive: true });

  let totalBefore = 0;
  let totalAfter = 0;
  const report = [];

  for (const filePath of files) {
    const relPath = path.relative(IMAGES_DIR, filePath);
    const backupPath = path.join(BACKUP_DIR, relPath);

    // Create backup subfolder if needed
    await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });

    const beforeStat = await fs.promises.stat(filePath);
    const beforeSize = beforeStat.size;
    totalBefore += beforeSize;

    // Backup original file
    await fs.promises.copyFile(filePath, backupPath);

    // Read metadata
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    const ext = path.extname(filePath).toLowerCase();

    let pipeline = sharp(filePath).rotate(); // auto-orient based on EXIF before stripping

    // Resize if wider or taller than 2000px
    if (originalWidth > 2000 || originalHeight > 2000) {
      pipeline = pipeline.resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    if (ext === ".jpg" || ext === ".jpeg") {
      pipeline = pipeline.jpeg({
        quality: 80,
        mozjpeg: true,
      });
    } else if (ext === ".png") {
      pipeline = pipeline.png({
        compressionLevel: 9,
        effort: 7,
      });
    }

    const tempPath = filePath + ".tmp";
    await pipeline.toFile(tempPath);

    const afterStat = await fs.promises.stat(tempPath);
    const afterSize = afterStat.size;

    // If optimized is smaller, replace; otherwise keep original
    if (afterSize < beforeSize) {
      await fs.promises.rename(tempPath, filePath);
      totalAfter += afterSize;
    } else {
      await fs.promises.unlink(tempPath);
      totalAfter += beforeSize;
    }

    const finalSize = Math.min(beforeSize, afterSize);
    const savingPercent = (((beforeSize - finalSize) / beforeSize) * 100).toFixed(1);

    report.push({
      relPath,
      dimensions: `${originalWidth}x${originalHeight}`,
      before: beforeSize,
      after: finalSize,
      savings: savingPercent,
    });
  }

  // Print results table
  console.log(
    `${"File".padEnd(40)} | ${"Original Dim".padEnd(12)} | ${"Before".padEnd(10)} | ${"After".padEnd(10)} | ${"Savings"}`
  );
  console.log("-".repeat(85));
  for (const r of report) {
    console.log(
      `${r.relPath.padEnd(40)} | ${r.dimensions.padEnd(12)} | ${formatBytes(r.before).padEnd(10)} | ${formatBytes(r.after).padEnd(10)} | ${r.savings}%`
    );
  }

  console.log("=".repeat(85));
  console.log(`TOTAL BEFORE : ${formatBytes(totalBefore)}`);
  console.log(`TOTAL AFTER  : ${formatBytes(totalAfter)}`);
  const overallSavings = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);
  console.log(`TOTAL SAVINGS: ${formatBytes(totalBefore - totalAfter)} (${overallSavings}% reduction)`);
  console.log(`Originals safely backed up in: ${BACKUP_DIR}\n`);
}

main().catch((err) => {
  console.error("Optimization failed:", err);
  process.exit(1);
});

