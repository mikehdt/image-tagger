console.log("=== AREA-BASED BUCKETING (Kohya's Method) ===");
const targetArea = 1024 * 1024; // 1,048,576
const stepSize = 64;
// const maxSize = 2048;
// const minSize = 256;

console.log('Target area:', targetArea.toLocaleString());
console.log('');

// Generate some example buckets
const examples = [
  { width: 1472, description: 'Our problem case' },
  { width: 1600, description: 'The mysterious case' },
  { width: 1024, description: 'Square bucket' },
  { width: 512, description: 'Very wide bucket' },
];

examples.forEach(({ width, description }) => {
  const idealHeight = targetArea / width;
  const height = Math.floor(idealHeight / stepSize) * stepSize;
  const actualArea = width * height;
  const perimeter = width + height;

  console.log(`${description}:`);
  console.log(`  ${width} × ${height} = ${actualArea.toLocaleString()} area`);
  console.log(
    `  Perimeter: ${width} + ${height} = ${perimeter} (NOT constrained to 2048!)`,
  );
  console.log(
    `  Area efficiency: ${((actualArea / targetArea) * 100).toFixed(1)}%`,
  );
  console.log('');
});

console.log('=== WHY 1600×640 EXISTS ===');
console.log('1600 width gives ideal height:', (targetArea / 1600).toFixed(2));
console.log('Rounded to 64px steps:', Math.floor(targetArea / 1600 / 64) * 64);
console.log('1600 ≤ maxSize (2048)? YES - so this bucket is valid!');
console.log('640 ≥ minSize (256)? YES - so this bucket is valid!');
