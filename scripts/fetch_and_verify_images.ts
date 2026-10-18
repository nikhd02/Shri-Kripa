import * as fs from 'fs';
import * as https from 'https';

interface DishQuery {
  dish: string;
  category: string;
  searchTerm: string;
}

const dishes: DishQuery[] = JSON.parse(fs.readFileSync('scripts/dish_query_list.json', 'utf-8'));

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'ShriKripaMenuBot/1.0 (https://shreekripa.in; contact@shreekripa.in)',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    ).on('error', reject);
  });
}

function verifyImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request(
        u,
        {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
            const ct = res.headers['content-type'] || '';
            if (ct.startsWith('image/')) {
              resolve(true);
              return;
            }
          }
          resolve(false);
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

async function searchWikimedia(query: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encoded}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&gsrlimit=5`;
    const res = await fetchJson(url);
    if (!res.query || !res.query.pages) return null;

    const pages = Object.values(res.query.pages) as any[];
    for (const page of pages) {
      if (page.imageinfo && page.imageinfo[0]) {
        const title = (page.title || '').toLowerCase();
        // Skip audio, pdf, svg icons
        if (title.endsWith('.ogg') || title.endsWith('.pdf') || title.endsWith('.svg') || title.endsWith('.webm')) {
          continue;
        }
        const imgUrl = page.imageinfo[0].thumburl || page.imageinfo[0].url;
        if (imgUrl) {
          const isValid = await verifyImageUrl(imgUrl);
          if (isValid) return imgUrl;
        }
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
}

async function run() {
  console.log(`Starting image discovery for ${dishes.length} dishes...`);
  const results: Record<string, { dish: string; category: string; imageUrl: string | null }> = {};

  for (let i = 0; i < dishes.length; i++) {
    const item = dishes[i];
    console.log(`[${i + 1}/${dishes.length}] Searching for: ${item.dish} (${item.searchTerm})...`);
    let img = await searchWikimedia(item.searchTerm);
    if (!img && item.searchTerm !== item.dish) {
      img = await searchWikimedia(item.dish);
    }
    results[item.dish] = {
      dish: item.dish,
      category: item.category,
      imageUrl: img,
    };
    if (img) {
      console.log(`  -> Found: ${img.substring(0, 70)}...`);
    } else {
      console.log(`  -> Not found`);
    }
    // Polite delay
    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync('scripts/discovered_dish_images.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('Finished discovery. Saved to scripts/discovered_dish_images.json');
}

run();
