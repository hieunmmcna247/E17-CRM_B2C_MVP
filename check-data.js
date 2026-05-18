const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://hgemzdmsolswbxgeqajj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZW16ZG1zb2xzd2J4Z2VxYWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg5NDI4OCwiZXhwIjoyMDkzNDcwMjg4fQ.eUp1qhvplHKOSOLqJtB9XQ7-f-vZ9S-0H_9_STD4j-I";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
  console.log('🔍 Đang kiểm tra dữ liệu trong Database...');
  
  const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
  
  console.log(`- Số lượng Lead: ${leadCount}`);
  console.log(`- Số lượng Task: ${taskCount}`);
  
  if (leadCount > 0) {
    const { data: sampleLeads } = await supabase.from('leads').select('id, name').limit(3);
    console.log('\n📌 Một số ID Lead có sẵn trong DB (dùng cái này để gán vào task):');
    sampleLeads.forEach(l => console.log(`  ID: ${l.id} - Tên: ${l.name}`));
  }
}

check();
