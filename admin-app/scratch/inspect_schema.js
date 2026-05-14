const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://klnmqnffkwgbpjceqkst.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbm1xbmZma3dnYnBqY2Vxa3N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA4NjkxOCwiZXhwIjoyMDkxNjYyOTE4fQ.utsWfdwvai3ghs9JvtbBcufhagPRy-7PZEidgTPMZHA');

async function inspectOrders() {
    const { data: row } = await supabase.from('orders').select('*').limit(1).single();
    if (row) {
        console.log('Order row keys:', Object.keys(row));
        console.log('Order ID type:', typeof row.id);
    }
}

inspectOrders();
