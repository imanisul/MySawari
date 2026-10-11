const fs = require('fs');
const path = require('path');
const https = require('https');

const uniqueVehicles = [
  'Alto 800', 'Alto K10', 'Santro', 'WagonR', 'Grand i10', 'Ignis', 'Tiago',
  'Glanza', 'Tigor', 'Baleno', 'Punch', 'Dzire', 'Aura', 'i20', 'Altroz',
  'Ciaz', 'Fronx', 'Taisor', 'Brezza', 'XUV300', 'Nexon', 'Triber', 'Bolero',
  'Scorpio', 'Innova Hycross', 'Pleasure', 'Yamaha Fascino', 'NTorq',
  'Hunter 350', 'Scram 411', 'Creta', 'Celerio', 'Ertiga', 'Venue',
  'Activa 6G', 'Amaze', 'Avenis', 'Jawa', 'Xpulse 200'
];

const TARGET_DIR = path.join(__dirname, 'assets', 'images', 'vehicles');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function fetchWikiImage(query) {
  return new Promise((resolve, reject) => {
    // Search Wikipedia
    const searchQuery = encodeURIComponent(query + ' (car) OR ' + query + ' motorcycle');
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&utf8=&format=json`;
    
    https.get(searchUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.query && json.query.search && json.query.search.length > 0) {
            const pageTitle = encodeURIComponent(json.query.search[0].title);
            
            const imageUrlStr = `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=pageimages&format=json&pithumbsize=800`;
            https.get(imageUrlStr, (imgRes) => {
              let imgData = '';
              imgRes.on('data', chunk => imgData += chunk);
              imgRes.on('end', () => {
                const imgJson = JSON.parse(imgData);
                const pages = imgJson.query.pages;
                const pageId = Object.keys(pages)[0];
                if (pages[pageId] && pages[pageId].thumbnail) {
                  resolve(pages[pageId].thumbnail.source);
                } else {
                  resolve(null);
                }
              });
            }).on('error', (e) => resolve(null));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (e) => resolve(null));
  });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    // using curl since https.get sometimes fails with redirects
    const { exec } = require('child_process');
    exec(`curl -L -s -o "${filepath}" "${url}"`, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(filepath);
    });
  });
}

const safeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '_');

async function main() {
  console.log('Starting image downloads...');
  let mapping = 'export const vehicleImages: Record<string, any> = {\n';

  for (const v of uniqueVehicles) {
    const filename = `${safeName(v)}.jpg`;
    const filepath = path.join(TARGET_DIR, filename);
    
    let imgUrl = await fetchWikiImage(v);
    if (!imgUrl) {
      console.log(`❌ Could not find Wikipedia image for: ${v}. Fallback to generic image.`);
      imgUrl = `https://dummyimage.com/600x400/cccccc/000000.jpg&text=${encodeURIComponent(v)}`;
    }
    
    try {
      await downloadImage(imgUrl, filepath);
      console.log(`✅ Downloaded: ${v} -> ${filename}`);
      mapping += `  '${safeName(v)}': require('../../assets/images/vehicles/${filename}'),\n`;
    } catch (e) {
      console.log(`Failed to download ${v}: ${e.message}`);
    }
  }

  mapping += '};\n\n';
  mapping += `export const getVehicleImage = (vehicleName: string, isBike: boolean) => {
  const normalized = vehicleName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Try exact match
  if (vehicleImages[normalized]) return vehicleImages[normalized];
  
  // Try partial match
  for (const key of Object.keys(vehicleImages)) {
    if (normalized.includes(key)) {
      return vehicleImages[key];
    }
  }
  
  return isBike ? require('../../assets/images/hunter.jpg') : require('../../assets/images/swift.jpg');
};\n`;

  const mappingFile = path.join(__dirname, 'utils', 'vehicleImages.ts');
  if (!fs.existsSync(path.dirname(mappingFile))) {
    fs.mkdirSync(path.dirname(mappingFile), { recursive: true });
  }
  fs.writeFileSync(mappingFile, mapping);
  console.log('✅ Created mapping file: utils/vehicleImages.ts');
}

main();
