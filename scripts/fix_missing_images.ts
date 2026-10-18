import * as https from 'https';
import * as fs from 'fs';

const missingDishes = [
  { dish: 'Gulab Jamun', query: 'Gulab jamun' },
  { dish: 'Rasgulla', query: 'Rasgulla' },
  { dish: 'Cham Cham', query: 'Chomchom' },
  { dish: 'Sizzling Brownie', query: 'Brownie' },
  { dish: 'Onion Pakoda', query: 'Pakora' },
  { dish: 'Veg. Pakoda', query: 'Pakora' },
  { dish: 'Paneer Pakoda', query: 'Paneer pakora' },
  { dish: 'Finger Chips', query: 'French fries' },
  { dish: 'Paneer Butter Masala', query: 'Paneer butter masala' },
  { dish: 'Paneer Tikka', query: 'Paneer tikka' },
  { dish: 'Veg. Chowmein', query: 'Chow mein' },
  { dish: 'Veg. Manchurian', query: 'Manchurian' },
  { dish: 'Lassi', query: 'Lassi' },
  { dish: 'Normal Thali', query: 'Thali' },
  { dish: 'Banana Shake', query: 'Banana smoothie' },
  { dish: 'Harabhara Kabab', query: 'Kebab' },
  { dish: 'Potato Chill (Dry)', query: 'Chilli potato' },
];

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'ShriKripaMenuBot/1.0 (contact@shreekripa.in)',
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      }
    ).on('error', reject);
  });
}

function checkUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request(
        u,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
            resolve(true);
          } else {
            resolve(false);
          }
          res.resume();
        }
      );
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  const currentMap: Record<string, string | null> = JSON.parse(
    fs.readFileSync('scripts/final_verified_menu_images.json', 'utf-8')
  );

  for (const item of missingDishes) {
    console.log(`Searching exact Wikipedia article image for: ${item.dish}...`);
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(item.query)}&prop=pageimages&format=json&pithumbsize=800`;
      const data = await fetchJson(wikiUrl);
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages) as any[];
        if (pages[0] && pages[0].thumbnail && pages[0].thumbnail.source) {
          const imgUrl = pages[0].thumbnail.source;
          const ok = await checkUrl(imgUrl);
          if (ok) {
            console.log(`  -> SUCCESS: ${imgUrl}`);
            currentMap[item.dish] = imgUrl;
          } else {
            console.log(`  -> HTTP fail: ${imgUrl}`);
          }
        } else {
          console.log(`  -> No thumbnail found for ${item.query}`);
        }
      }
    } catch (err: any) {
      console.log(`  -> Error: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const verifiedCount = Object.values(currentMap).filter((u) => u !== null).length;
  console.log(`\nUpdated total verified images: ${verifiedCount} / ${Object.keys(currentMap).length}`);
  fs.writeFileSync('scripts/final_verified_menu_images.json', JSON.stringify(currentMap, null, 2), 'utf-8');
}

main().catch(console.error);
