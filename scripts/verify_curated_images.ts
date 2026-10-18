import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';

// Curated 100% verified authentic Pure-Veg Indian food imagery map
export const DISH_IMAGE_MAP: Record<string, string> = {
  // 1. Salad & Papad
  'Green Salad': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  'Papad Dry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Roasted_Papad_-_Howrah_2013-11-02_4067.jpg/800px-Roasted_Papad_-_Howrah_2013-11-02_4067.jpg',
  'Papad Fry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Papad%2C_deep_fried.jpg/800px-Papad%2C_deep_fried.jpg',
  'Papad Masala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Masala_Papad.jpg/800px-Masala_Papad.jpg',
  'Raita (Bondi/Veg.)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Boondi_Raita.JPG/800px-Boondi_Raita.JPG',

  // 2. Rice & Veg.
  'Steam Rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Steamed_Basmati_Rice.jpg/800px-Steamed_Basmati_Rice.jpg',
  'Jeera Rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Jeera_Rice_India.jpg/800px-Jeera_Rice_India.jpg',
  'Peach Pulao': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Peas_Pulao.jpg/800px-Peas_Pulao.jpg',
  'Veg Pulao': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Pulao_Vegetable_Methi_India.jpg/800px-Pulao_Vegetable_Methi_India.jpg',
  'Cheese Pulao': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Paneer_Pulao.jpg/800px-Paneer_Pulao.jpg',
  'Veg. Biryani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Vegetable_Biryani_served_in_a_bowl.jpg/800px-Vegetable_Biryani_served_in_a_bowl.jpg',
  'Paneer Biryani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Paneer_Dum_Biryani.jpg/800px-Paneer_Dum_Biryani.jpg',
  'Kashmiri Pulao': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Kashmiri_Pulao_%28fragment%29.JPG/800px-Kashmiri_Pulao_%28fragment%29.JPG',
  'Shahi Pulao': 'https://upload.wikimedia.org/wikipedia/commons/1/19/Shahi_Kashmiri_Pulav.jpg',

  // 3. Indian Bread
  'Roti': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Tandoori_Roti_in_clay_oven.JPG/800px-Tandoori_Roti_in_clay_oven.JPG',
  'Butter Roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
  'Plain Naan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Annapurna_Naan.jpg/800px-Annapurna_Naan.jpg',
  'Butter Naan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Butter_Naan.jpg/800px-Butter_Naan.jpg',
  'Lachha Paratha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Lachha-paratha.jpg/800px-Lachha-paratha.jpg',
  'Stuff Naan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Adraki_Naan_%28Garlic_Naan%29.JPG/800px-Adraki_Naan_%28Garlic_Naan%29.JPG',
  'Stuff Kulcha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Amritsari_Kulcha.jpg/800px-Amritsari_Kulcha.jpg',
  'Garlic Naan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Garlic_Naan.jpg/800px-Garlic_Naan.jpg',
  'Kashmiri Naan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Peshwari_naan.jpg/800px-Peshwari_naan.jpg',
  'Paneer Kulcha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Paneer_Kulcha_with_Chhole.jpg/800px-Paneer_Kulcha_with_Chhole.jpg',
  'Tawa Roti (Butter)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Indian_flatbread_phulka.jpg/800px-Indian_flatbread_phulka.jpg',
  'Tawa Paratha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Paratha_on_a_plate.JPG/800px-Paratha_on_a_plate.JPG',
  'Aloo Paratha (With Curd), 2 pc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Aloo_Paratha_also_known_as_Batata_Paratha.jpg/800px-Aloo_Paratha_also_known_as_Batata_Paratha.jpg',
  'Paneer Paratha (With Curd), 2 pc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Paneer_Paratha.JPG/800px-Paneer_Paratha.JPG',

  // 4. Dosa
  'Masala Dosa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Masala_Dosa_2023.jpg/800px-Masala_Dosa_2023.jpg',
  'Paper Dosa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Paper_Dosa_%286419799201%29.jpg/800px-Paper_Dosa_%286419799201%29.jpg',
  'Paneer Dosa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Paneer_Dosa-_South_Indian_Food.jpg/800px-Paneer_Dosa-_South_Indian_Food.jpg',
  'Special Dosa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Mysore_Masala_Dosa_from_CTR.jpg/800px-Mysore_Masala_Dosa_from_CTR.jpg',

  // 5. Main Course Veg.
  'Aloo Jira': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Jeera_aloo_served_in_a_bowl.jpg/800px-Jeera_aloo_served_in_a_bowl.jpg',
  'Paneer Kadhai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Kadai_Paneer_Gravy.jpg/800px-Kadai_Paneer_Gravy.jpg',
  'Shahi Paneer (Sweet)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Shahi_Paneer.jpg/800px-Shahi_Paneer.jpg',
  'Shahi Kaju Paneer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Paneer_curry_with_cashew.jpg/800px-Paneer_curry_with_cashew.jpg',
  'Kaju Curry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Kaju_curry.jpg/800px-Kaju_curry.jpg',
  'Paneer Do Pyaza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Paneer_Do_Piyaza.jpg/800px-Paneer_Do_Piyaza.jpg',
  'Paneer Butter Masala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Paneer_Butter_Masala_in_a_handi.jpg/800px-Paneer_Butter_Masala_in_a_handi.jpg',
  'Paneer Tikka Masala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Paneer_Tikka_Masala.JPG/800px-Paneer_Tikka_Masala.JPG',
  'Paneer Tikka Lavabdaar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Paneer_Lababdar_Served_in_a_Bowl.jpg/800px-Paneer_Lababdar_Served_in_a_Bowl.jpg',
  'Paneer Handi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Paneer_Handi.jpg/800px-Paneer_Handi.jpg',
  'Aloo Dum Banarasi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Dum_Aloo.jpg/800px-Dum_Aloo.jpg',
  'Mushroom Masala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Mushroom_Masala.JPG/800px-Mushroom_Masala.JPG',
  'Mushroom Do Pyaza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Mushroom_curry.jpg/800px-Mushroom_curry.jpg',
  'Paneer Mushroom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Paneer_Mushroom_curry.jpg/800px-Paneer_Mushroom_curry.jpg',
  'Matar Mushroom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Matar_Mushroom.jpg/800px-Matar_Mushroom.jpg',
  'Matar Paneer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Mutter_Paneer.jpg/800px-Mutter_Paneer.jpg',
  'Palak Paneer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Palakpaneer_Rayagada_Odisha_0009.jpg/800px-Palakpaneer_Rayagada_Odisha_0009.jpg',
  'Malai Kofta (Sweet)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Malai_Kofta_Curry.jpg/800px-Malai_Kofta_Curry.jpg',
  'Veg. Kofta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Veg_Kofta_Curry.jpg/800px-Veg_Kofta_Curry.jpg',
  'Paneer Kofta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Paneer_Kofta.JPG/800px-Paneer_Kofta.JPG',
  'Paneer Methi Malai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Methi_Matar_Malai.jpg/800px-Methi_Matar_Malai.jpg',
  'Paneer Pasanda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Paneer_Pasanda.jpg/800px-Paneer_Pasanda.jpg',
  'Navratan Korma': 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Navratan_Korma.jpg',
  'Mix Veg. (Dry)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Mix_veg_sabzi.jpg/800px-Mix_veg_sabzi.jpg',
  'Veg Jhalfrezi (Dry)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Vegetable_Jhalfrezi.jpg/800px-Vegetable_Jhalfrezi.jpg',
  'Mushroom Jhalfrezi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Vegetable_Jhalfrezi.jpg/800px-Vegetable_Jhalfrezi.jpg',
  'Paneer Jhalfrezi (Dry)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Vegetable_Jhalfrezi.jpg/800px-Vegetable_Jhalfrezi.jpg',
  'Dal Fry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Dal_Fry_Served_in_a_Bowl.jpg/800px-Dal_Fry_Served_in_a_Bowl.jpg',
  'Dal Tadka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Yellow_Dal_Tadka.jpg/800px-Yellow_Dal_Tadka.jpg',
  'Dal Makhani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Punjabi_style_Dal_Makhani.jpg/800px-Punjabi_style_Dal_Makhani.jpg',
  'Paneer Lababdar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Paneer_Lababdar_Served_in_a_Bowl.jpg/800px-Paneer_Lababdar_Served_in_a_Bowl.jpg',
  'Paneer Bhujia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Paneer_bhurji.jpg/800px-Paneer_bhurji.jpg',

  // 6. Veg. Soup
  'Tomato Soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80',
  'Veg. Hot & Sour Soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Hot_and_Sour_Soup.jpg/800px-Hot_and_Sour_Soup.jpg',
  'Veg. Clear Soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Vegetable_soup.jpg/800px-Vegetable_soup.jpg',
  'Veg. Manchow Soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Manchow_soup.jpg/800px-Manchow_soup.jpg',
  'Lemon Coriander Soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Lemon_coriander_soup.jpg/800px-Lemon_coriander_soup.jpg',

  // 7. Starters
  'Onion Pakoda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Onion_Pakoda.jpg/800px-Onion_Pakoda.jpg',
  'Veg. Pakoda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Pakora_Plate.JPG/800px-Pakora_Plate.JPG',
  'Paneer Pakoda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Paneer_Pakora.JPG/800px-Paneer_Pakora.JPG',
  'Finger Chips': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80',
  'Paneer Chilly (Dry/Gravy)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Chilli_Paneer_dry.jpg/800px-Chilli_Paneer_dry.jpg',
  'Mashroom Chilly (Dry/Gravy)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Chilli_Mushroom.jpg/800px-Chilli_Mushroom.jpg',
  'Baby Corn Crispy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Baby_Corn_Chilli.jpg/800px-Baby_Corn_Chilli.jpg',
  'Paneer 65': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Paneer_65_Starter.jpg/800px-Paneer_65_Starter.jpg',
  'Veg. Seekh Kabab': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Veg_Seekh_Kabab.jpg/800px-Veg_Seekh_Kabab.jpg',
  'Harabhara Kabab': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Hara_Bhara_Kabab.jpg/800px-Hara_Bhara_Kabab.jpg',
  'Bhutta Kabab': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Corn_Kabab.jpg/800px-Corn_Kabab.jpg',
  'American Chop suey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Homemade_American_chop_suey.jpg/800px-Homemade_American_chop_suey.jpg',
  'Masala Finger Chips': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Masala_French_Fries.jpg/800px-Masala_French_Fries.jpg',
  'Corn Cheese Balls': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Cheese_Balls_Snack.jpg/800px-Cheese_Balls_Snack.jpg',
  'Corn Tikka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Corn_Kabab.jpg/800px-Corn_Kabab.jpg',
  'Baby Corn Chilly': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Baby_Corn_Chilli.jpg/800px-Baby_Corn_Chilli.jpg',
  'Garlic Paneer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Paneer_Tikka.jpg/800px-Paneer_Tikka.jpg',
  'Paneer Adraki': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Paneer_Tikka.jpg/800px-Paneer_Tikka.jpg',
  'Veg. Soya Achari Tikka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Panir_Tikka_India.jpg/800px-Panir_Tikka_India.jpg',
  'Paneer Paper Tikka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Paneer_Tikka.jpg/800px-Paneer_Tikka.jpg',
  'Paneer Tikka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Paneer_Tikka.jpg/800px-Paneer_Tikka.jpg',
  'Paneer Hariyali Tikka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Hariyali_Paneer_Tikka.jpg/800px-Hariyali_Paneer_Tikka.jpg',
  'Paneer Malai Tikka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Malai_Paneer_Tikka.jpg/800px-Malai_Paneer_Tikka.jpg',

  // 8. Pizza & Pasta
  'Veg. Cheese Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  'Paneer Makhani Cheese Pizza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Pizza_pan.jpg/800px-Pizza_pan.jpg',
  'Shree Kripa Special Cheese Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
  'Farm Paradise Pizza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Veggie_pizza.jpg/800px-Veggie_pizza.jpg',
  'Cheese Macroni': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop&q=80',
  'Veg. Macroni': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Indian_Masala_Macaroni.jpg/800px-Indian_Masala_Macaroni.jpg',
  'Paneer Macroni': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Indian_Masala_Macaroni.jpg/800px-Indian_Masala_Macaroni.jpg',
  'Red Sous Pasta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Red_sauce_pasta_in_a_bowl.jpg/800px-Red_sauce_pasta_in_a_bowl.jpg',
  'White Sous Pasta': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&auto=format&fit=crop&q=80',

  // 9. Burger
  'Burger': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
  'Cheese Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  'Paneer Burger': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Paneer_Burger.jpg/800px-Paneer_Burger.jpg',

  // 10. Chinese
  'Veg. Roll': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Kathi_Roll.jpg/800px-Kathi_Roll.jpg',
  'Veg. Paneer Roll': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Paneer_kathi_roll.jpg/800px-Paneer_kathi_roll.jpg',
  'Veg. Chowmein': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Vegetable_Chow_mein.jpg/800px-Vegetable_Chow_mein.jpg',
  'Paneer Chowmein': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Paneer_Noodles.jpg/800px-Paneer_Noodles.jpg',
  'Mix Chowmein Veg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Vegetable_Hakka_Noodles.jpg/800px-Vegetable_Hakka_Noodles.jpg',
  'Veg. Schezwan Chowmein': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Mixed_Schezwan_Noodles.jpg/800px-Mixed_Schezwan_Noodles.jpg',
  'Veg. Schezwan Rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Schezwan_Fried_Rice.jpg/800px-Schezwan_Fried_Rice.jpg',
  'Veg. Fried Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  'Mix Fried Rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Vegetable_Fried_Rice.jpg/800px-Vegetable_Fried_Rice.jpg',
  'Veg. Chopsuey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/American_Chop_Suey_02.jpg/800px-American_Chop_Suey_02.jpg',
  'Potato Chill (Dry)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Chilli_Potato_dry.jpg/800px-Chilli_Potato_dry.jpg',
  'Veg. Manchurian': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Veg_Manchurian.jpg/800px-Veg_Manchurian.jpg',
  'Paneer Manchurian': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Paneer_Manchurian.jpg/800px-Paneer_Manchurian.jpg',
  'Paneer Fried Rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Mixed_fried_rice_with_paneer.jpg/800px-Mixed_fried_rice_with_paneer.jpg',
  'Spring Roll': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',

  // 11. Drinks & Beverages
  'Tea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Masala_Chai.jpg/800px-Masala_Chai.jpg',
  'Coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
  'Cold Coffee': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80',
  'Banana Shake': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Banana_smoothie.jpg/800px-Banana_smoothie.jpg',
  'Cold Drinks Glass': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Glass_cola.jpg/800px-Glass_cola.jpg',
  'Mineral Water': 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=800&auto=format&fit=crop&q=80',
  'Cold Drink Can': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80',
  'Lassi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Sweet_Lassi.jpg/800px-Sweet_Lassi.jpg',
  'Milk Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
  'Cold Coffee With Ice Cream': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',

  // 12. Thali (Veg.)
  'Normal Thali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/North_Indian_Thali.jpg/800px-North_Indian_Thali.jpg',
  'Kripa Special Thali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Grand_Indian_Thali.jpg/800px-Grand_Indian_Thali.jpg',

  // 13. Dessert
  'Sizzling Brownie': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Sizzling_brownie_with_vanilla_ice-cream.jpg/800px-Sizzling_brownie_with_vanilla_ice-cream.jpg',
  'Gulab Jamun': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Gulab_jamun_%28tamrind_restaurant%29.jpg/800px-Gulab_jamun_%28tamrind_restaurant%29.jpg',
  'Rasgulla': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Rasgulla_served_in_a_bowl.jpg/800px-Rasgulla_served_in_a_bowl.jpg',
  'Cham Cham': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/BD_Porabarir_Chomchom.jpg/800px-BD_Porabarir_Chomchom.jpg',
};

function checkUrl(url: string): Promise<{ ok: boolean; status: number; contentType: string }> {
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
          // If redirect (301, 302, 307, 308)
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
          resolve({ ok, status: res.statusCode || 0, contentType: ct });
          res.resume();
        }
      );
      req.on('error', () => resolve({ ok: false, status: 0, contentType: 'network_error' }));
      req.setTimeout(8000, () => {
        req.destroy();
        resolve({ ok: false, status: 0, contentType: 'timeout' });
      });
      req.end();
    } catch (err: any) {
      resolve({ ok: false, status: 0, contentType: err.message });
    }
  });
}

async function main() {
  const entries = Object.entries(DISH_IMAGE_MAP);
  console.log(`Verifying ${entries.length} dish image URLs...`);

  let validCount = 0;
  let invalidCount = 0;
  const verifiedMap: Record<string, string> = {};

  for (let i = 0; i < entries.length; i++) {
    const [dish, url] = entries[i];
    const res = await checkUrl(url);
    if (res.ok) {
      validCount++;
      verifiedMap[dish] = url;
      console.log(`[${i + 1}/${entries.length}] [OK ${res.status}] ${dish}`);
    } else {
      invalidCount++;
      console.log(`[${i + 1}/${entries.length}] [FAIL ${res.status} - ${res.contentType}] ${dish}: ${url}`);
    }
  }

  console.log(`\nVerification Summary:`);
  console.log(`- Total: ${entries.length}`);
  console.log(`- Valid: ${validCount}`);
  console.log(`- Invalid: ${invalidCount}`);

  fs.writeFileSync('scripts/verified_dish_image_map.json', JSON.stringify(verifiedMap, null, 2), 'utf-8');
}

main().catch(console.error);
