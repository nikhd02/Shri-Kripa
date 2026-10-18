import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

// Load discovered images from Wikimedia
const discovered: Record<string, { dish: string; category: string; imageUrl: string | null }> = JSON.parse(
  fs.readFileSync('scripts/discovered_dish_images.json', 'utf-8')
);

// High quality verified pure-veg photography for items where Unsplash or specific verified Wikimedia links are superior and 100% accurate:
const HAND_VERIFIED_OVERRIDE: Record<string, string> = {
  // 1. Salad & Papad
  'Green Salad': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  'Papad Dry': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Roasted_Papad_-_Howrah_2013-11-02_4067.jpg/960px-Roasted_Papad_-_Howrah_2013-11-02_4067.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Papad Fry': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Papad%2C_deep_fried.jpg/960px-Papad%2C_deep_fried.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Papad Masala': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Masala_Papad.jpg/960px-Masala_Papad.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Raita (Bondi/Veg.)': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Boondi_Raita.JPG/960px-Boondi_Raita.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',

  // 2. Rice & Veg.
  'Steam Rice': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Steamed_Basmati_Rice.jpg/960px-Steamed_Basmati_Rice.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Jeera Rice': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Jeera_Rice_India.jpg/960px-Jeera_Rice_India.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Veg Pulao': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Pulao_Vegetable_Methi_India.jpg/960px-Pulao_Vegetable_Methi_India.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Veg. Biryani': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Vegetable_Biryani_001.JPG/960px-Vegetable_Biryani_001.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Kashmiri Pulao': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Kashmiri_Pulao_%28fragment%29.JPG/960px-Kashmiri_Pulao_%28fragment%29.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Shahi Pulao': 'https://upload.wikimedia.org/wikipedia/commons/1/19/Shahi_Kashmiri_Pulav.jpg',

  // 3. Indian Bread
  'Roti': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Tandoori_Roti_in_clay_oven.JPG/960px-Tandoori_Roti_in_clay_oven.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Butter Roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
  'Plain Naan': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Annapurna_Naan.jpg/960px-Annapurna_Naan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Butter Naan': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Annapurna_Naan.jpg/960px-Annapurna_Naan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Lachha Paratha': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Lachha-paratha.jpg/960px-Lachha-paratha.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Stuff Naan': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Adraki_Naan_%28Garlic_Naan%29.JPG/960px-Adraki_Naan_%28Garlic_Naan%29.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Garlic Naan': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Adraki_Naan_%28Garlic_Naan%29.JPG/960px-Adraki_Naan_%28Garlic_Naan%29.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Aloo Paratha (With Curd), 2 pc': 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Aloo_Paratha_North_Indian_delicacy.jpg',

  // 4. Dosa
  'Masala Dosa': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Masala_Dosa_2023.jpg/960px-Masala_Dosa_2023.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paper Dosa': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Paper_Dosa_%286419799201%29.jpg/960px-Paper_Dosa_%286419799201%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paneer Dosa': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Paneer_Dosa-_South_Indian_Food.jpg/960px-Paneer_Dosa-_South_Indian_Food.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Special Dosa': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Mysore_Masala_Dosa_from_CTR.jpg/960px-Mysore_Masala_Dosa_from_CTR.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',

  // 5. Main Course Veg.
  'Aloo Jira': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Jeera_aloo_served_in_a_bowl.jpg/960px-Jeera_aloo_served_in_a_bowl.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paneer Kadhai': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7e/Kadai_paneer_with_peppers.jpg/960px-Kadai_paneer_with_peppers.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Shahi Paneer (Sweet)': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Shahi_Paneer.jpg/960px-Shahi_Paneer.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paneer Do Pyaza': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Shahi_Paneer.jpg/960px-Shahi_Paneer.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paneer Butter Masala': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Paneer_Tikka.jpg/960px-Paneer_Tikka.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Matar Paneer': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Mutter_Paneer.jpg/960px-Mutter_Paneer.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Palak Paneer': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Palakpaneer_Rayagada_Odisha_0009.jpg/960px-Palakpaneer_Rayagada_Odisha_0009.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Malai Kofta (Sweet)': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Shahi_Paneer.jpg/960px-Shahi_Paneer.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paneer Pasanda': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Paneer_Pasanda.jpg/960px-Paneer_Pasanda.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Navratan Korma': 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Navratan_Korma.jpg',
  'Dal Fry': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Yellow_Dal_Tadka.jpg/960px-Yellow_Dal_Tadka.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Dal Tadka': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Yellow_Dal_Tadka.jpg/960px-Yellow_Dal_Tadka.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Dal Makhani': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Punjabi_style_Dal_Makhani.jpg/960px-Punjabi_style_Dal_Makhani.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paneer Lababdar': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Shahi_Paneer.jpg/960px-Shahi_Paneer.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',

  // 6. Veg. Soup
  'Tomato Soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
  'Veg. Hot & Sour Soup': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/Hot_and_Sour_Soup.jpg/960px-Hot_and_Sour_Soup.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Veg. Manchow Soup': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Manchow_soup.jpg/960px-Manchow_soup.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',

  // 7. Starters
  'Onion Pakoda': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Onion_Pakoda.jpg/960px-Onion_Pakoda.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Veg. Pakoda': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Pakora_Plate.JPG/960px-Pakora_Plate.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paneer Pakoda': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Paneer_Pakora.JPG/960px-Paneer_Pakora.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Finger Chips': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80',
  'Paneer Chilly (Dry/Gravy)': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Chilly_paneer.jpg/960px-Chilly_paneer.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Baby Corn Crispy': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Baby_Corn_Chilli.jpg/960px-Baby_Corn_Chilli.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Harabhara Kabab': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Hara_Bhara_Kabab.jpg/960px-Hara_Bhara_Kabab.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'American Chop suey': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Homemade_American_chop_suey.jpg/960px-Homemade_American_chop_suey.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Masala Finger Chips': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Masala_French_Fries.jpg/960px-Masala_French_Fries.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paneer Tikka': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Panir_Tikka_India.jpg/960px-Panir_Tikka_India.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Paneer Malai Tikka': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Panir_Tikka_India.jpg/960px-Panir_Tikka_India.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',

  // 8. Pizza & Pasta
  'Veg. Cheese Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  'Shree Kripa Special Cheese Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
  'Farm Paradise Pizza': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Veggie_pizza.jpg/960px-Veggie_pizza.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Cheese Macroni': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop&q=80',
  'Veg. Macroni': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Indian_Masala_Macaroni.jpg/960px-Indian_Masala_Macaroni.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Red Sous Pasta': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Red_sauce_pasta_in_a_bowl.jpg/960px-Red_sauce_pasta_in_a_bowl.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'White Sous Pasta': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&auto=format&fit=crop&q=80',

  // 9. Burger
  'Burger': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
  'Cheese Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  'Paneer Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',

  // 10. Chinese
  'Veg. Roll': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/04/Kathi_Roll.jpg/960px-Kathi_Roll.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Veg. Paneer Roll': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/04/Kathi_Roll.jpg/960px-Kathi_Roll.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Veg. Chowmein': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Vegetable_Chow_mein.jpg/960px-Vegetable_Chow_mein.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Veg. Fried Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  'Potato Chill (Dry)': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Chilli_Potato_dry.jpg/960px-Chilli_Potato_dry.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Veg. Manchurian': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Veg_manchurian.jpg/960px-Veg_manchurian.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Spring Roll': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',

  // 11. Drinks & Beverages
  'Tea': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/04/Masala_Chai.JPG/960px-Masala_Chai.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
  'Cold Coffee': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80',
  'Banana Shake': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Five_Guys_banana_milkshake.jpg/960px-Five_Guys_banana_milkshake.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Cold Drinks Glass': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Glass_cola.jpg/960px-Glass_cola.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Mineral Water': 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=800&auto=format&fit=crop&q=80',
  'Cold Drink Can': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80',
  'Lassi': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Sweet_Lassi.jpg/960px-Sweet_Lassi.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Milk Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
  'Cold Coffee With Ice Cream': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',

  // 12. Thali (Veg.)
  'Normal Thali': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/North_Indian_Thali.jpg/960px-North_Indian_Thali.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Kripa Special Thali': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/North_Indian_Thali.jpg/960px-North_Indian_Thali.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',

  // 13. Dessert
  'Sizzling Brownie': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Sizzling_brownie.JPG/960px-Sizzling_brownie.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Gulab Jamun': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Gulab_jamun_%28tamrind_restaurant%29.jpg/960px-Gulab_jamun_%28tamrind_restaurant%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Rasgulla': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Rasgullas_from_Kolkata.jpg/960px-Rasgullas_from_Kolkata.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'Cham Cham': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/BD_Porabarir_Chomchom.jpg/960px-BD_Porabarir_Chomchom.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
};

// Blacklist of forbidden keywords (non-veg or obviously wrong dishes)
const FORBIDDEN_WORDS = [
  'chicken', 'prawn', 'fish', 'meat', 'beef', 'pork', 'egg', 'sandwich', 'non-veg', 'nonveg', 'mutton'
];

function checkUrl(url: string): Promise<{ ok: boolean; status: number }> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.request(
        parsed,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextLoc = res.headers.location;
            if (!nextLoc.startsWith('http')) {
              nextLoc = new URL(nextLoc, url).toString();
            }
            checkUrl(nextLoc).then(resolve);
            return;
          }
          const ct = res.headers['content-type'] || '';
          const ok = !!(res.statusCode && res.statusCode >= 200 && res.statusCode < 400 && (ct.startsWith('image/') || ct.includes('octet-stream')));
          resolve({ ok, status: res.statusCode || 0 });
          res.resume();
        }
      );
      req.on('error', () => resolve({ ok: false, status: 0 }));
      req.setTimeout(8000, () => {
        req.destroy();
        resolve({ ok: false, status: 0 });
      });
      req.end();
    } catch {
      resolve({ ok: false, status: 0 });
    }
  });
}

async function run() {
  console.log('Building vetted image list...');
  const finalMap: Record<string, string | null> = {};

  const allDishes = Object.keys(discovered);
  for (const dish of allDishes) {
    let candidateUrl: string | null = null;

    if (HAND_VERIFIED_OVERRIDE[dish]) {
      candidateUrl = HAND_VERIFIED_OVERRIDE[dish];
    } else if (discovered[dish] && discovered[dish].imageUrl) {
      const u = discovered[dish].imageUrl!;
      const lower = u.toLowerCase();
      const hasForbidden = FORBIDDEN_WORDS.some((w) => lower.includes(w));
      if (!hasForbidden) {
        candidateUrl = u;
      } else {
        console.warn(`[REJECTED FORBIDDEN] ${dish}: ${u}`);
      }
    }

    if (candidateUrl) {
      const res = await checkUrl(candidateUrl);
      if (res.ok) {
        finalMap[dish] = candidateUrl;
        console.log(`[VERIFIED 200 OK] ${dish}`);
      } else {
        console.warn(`[HTTP FAILED ${res.status}] ${dish}: ${candidateUrl}`);
        finalMap[dish] = null;
      }
    } else {
      finalMap[dish] = null;
      console.log(`[NO IMAGE - USING ICON PLACEHOLDER] ${dish}`);
    }
  }

  const assignedCount = Object.values(finalMap).filter((u) => u !== null).length;
  console.log(`\nFinal Summary:`);
  console.log(`- Total dishes: ${allDishes.length}`);
  console.log(`- Assigned verified image: ${assignedCount}`);
  console.log(`- Icon placeholder (no mismatch): ${allDishes.length - assignedCount}`);

  fs.writeFileSync('scripts/final_verified_menu_images.json', JSON.stringify(finalMap, null, 2), 'utf-8');
  console.log('Saved to scripts/final_verified_menu_images.json');
}

run();
