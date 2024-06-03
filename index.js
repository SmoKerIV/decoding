const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const originalCsvFilePath = 'images.csv';
const imageFolder = 'images/';
const dbFilePath = 'data.db';

const db = new sqlite3.Database(dbFilePath);

async function saveImageAndModifyRow(row) {
  const imgData = row.img;
  const id = row.id;

  if (!imgData || !id) {
    console.error('Missing data in row:', row);
    throw new Error('Missing data in row');
  }

  const base64Image = imgData.split(';base64,').pop();
  const imageName = `${id}.png`;
  const imagePath = path.join(imageFolder, imageName);

  fs.writeFile(imagePath, base64Image, { encoding: 'base64' }, (err) => {
    if (err) {
      console.error('Error saving image:', err);
      throw err;
    } else {
      console.log(`Image saved: ${imageName}`);
      db.run("UPDATE images SET img = ? WHERE id = ?", [imageName, id], function(err) {
        if (err) {
          console.error('Error updating image name in database:', err);
          throw err;
        } else {
          console.log(`Image name updated in database for ID ${id}: ${imageName}`);
        }
      });
    }
  });
}

async function processCSV() {
  try {
    fs.createReadStream(originalCsvFilePath)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          await saveImageAndModifyRow(row);
        } catch (err) {
          console.error('Error processing row:', err);
        }
      })
      .on('end', () => {
        console.log('CSV file processed successfully');
        db.close((err) => {
          if (err) {
            console.error('Error closing database connection:', err);
          } else {
            console.log('Database connection closed.');
          }
        });
      })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err);
      });
  } catch (err) {
    console.error('Error processing CSV:', err);
  }
}

processCSV();
