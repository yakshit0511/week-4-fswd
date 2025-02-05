const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const categories = {
  Images: ['.jpg', '.jpeg', '.png', '.gif'],
  Documents: ['.pdf', '.doc', '.docx', '.txt', '.xlsx'],
  Videos: ['.mp4', '.mkv', '.avi'],
  Others: []
};

// Function to ask user for input in case the directory path is missing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askDirectoryPath() {
  return new Promise((resolve) => {
    rl.question('Please enter the directory path: ', (dirPath) => {
      rl.close();
      resolve(dirPath);
    });
  });
}

async function organizeFiles(directoryPath) {
  try {
    const dirExists = await fs.stat(directoryPath).catch(() => null);
    if (!dirExists) {
      return console.error('Invalid directory path.');
    }

    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const fileStat = await fs.stat(filePath);
      
      if (fileStat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        const category = Object.keys(categories).find(key => categories[key].includes(ext)) || 'Others';
        
        // Log the file categorization for debugging
        if (category === 'Others') {
          console.log(`File "${file}" is categorized as "Others".`);
        }
        
        const categoryPath = path.join(directoryPath, category);
        await fs.mkdir(categoryPath, { recursive: true });
        
        const destPath = path.join(categoryPath, file);
        
        // Check if the file already exists at destination
        try {
          await fs.rename(filePath, destPath);
        } catch (renameError) {
          console.error(`Error moving file "${file}" to "${category}": ${renameError.message}`);
        }
      }
    }

    // Create a summary.txt file with the categories
    const summary = Object.keys(categories).map(category => `${category}: ${categories[category].join(', ')}`).join('\n');
    await fs.writeFile(path.join(directoryPath, 'summary.txt'), summary);
    console.log('Files organized successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function run() {
  let directoryPath = process.argv[2];
  
  if (!directoryPath) {
    console.log('No directory path provided.');
    directoryPath = await askDirectoryPath();
  }
  
  if (directoryPath) {
    organizeFiles(directoryPath);
  } else {
    console.error('Directory path is required.');
    process.exit(1);
  }
}

run();
