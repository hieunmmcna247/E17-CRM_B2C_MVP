const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- CONFIG ---
const SUPABASE_URL = "https://hgemzdmsolswbxgeqajj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZW16ZG1zb2xzd2J4Z2VxYWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg5NDI4OCwiZXhwIjoyMDkzNDcwMjg4fQ.eUp1qhvplHKOSOLqJtB9XQ7-f-vZ9S-0H_9_STD4j-I";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function toISO(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  // Giả định định dạng YYYY-MM-DD HH:mm:ss
  try {
    const d = new Date(dateStr.replace(' ', 'T') + 'Z');
    return isNaN(d.getTime()) ? dateStr : d.toISOString();
  } catch (e) {
    return dateStr;
  }
}

async function main() {
  console.log('🚀 Đang đọc file tasks.csv...');
  
  const csvPath = path.join(__dirname, 'tasks.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Không tìm thấy file tasks.csv!');
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',');

  const allowedColumns = ['id', 'title', 'description', 'lead_id', 'assigned_to', 'assigned_to_name', 'priority', 'due_date', 'status'];

  const records = lines.slice(1).map(line => {
    const values = line.split(',');
    const record = {};
    headers.forEach((header, i) => {
      const h = header.trim();
      if (!allowedColumns.includes(h)) return; // Chỉ lấy các cột chắc chắn có trong DB

      let val = values[i] ? values[i].trim() : null;
      if (val === '') val = null;
      
      // Chuyển đổi ngày tháng
      if (h === 'due_date') {
        val = toISO(val);
      }
      record[h] = val;
    });
    return record;
  });

  console.log(`📦 Đang chuẩn bị đẩy ${records.length} nhiệm vụ lên Supabase...`);

  const { data, error } = await supabase
    .from('tasks')
    .upsert(records, { onConflict: 'id' });

  if (error) {
    console.error('❌ Lỗi khi import:', error.message);
  } else {
    console.log('✅ Import thành công!');
  }
}

main();
