require('dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const supabase = require('./backend/utils/supabaseClient');

async function run() {
  try {
    const { data, error } = await supabase.from('menu_items').insert({
      shop_id: null,
      name: 'alooo',
      description: 'asdasd',
      price: 122,
      prep_time: 12,
      avg_demand: 0,
      is_veg: true,
      is_available: true,
      image_url: ''
    }).select();
    
    console.log('SUCCESS:', data);
    if (error) {
       console.log('SUPABASE ERROR:', error);
    }
  } catch (err) {
    console.log('FATAL JS CATCH:', err);
  }
}
run();
