const fs = require('fs');

async function main() {
  const text = fs.readFileSync('new-data.txt', 'utf8');
  
  // Clear first
  console.log('Clearing old data...');
  const clearRes = await fetch('https://wa-automation-worker.rizkyap90s.workers.dev/api/knowledge/clear', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from('reternia.id@gmail.com:RETERNIAprabowo2024').toString('base64')
    }
  });
  console.log('Clear result:', await clearRes.text());

  // Ingest new data
  console.log('Ingesting new data...');
  const ingestRes = await fetch('https://wa-automation-worker.rizkyap90s.workers.dev/api/knowledge/ingest', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from('reternia.id@gmail.com:RETERNIAprabowo2024').toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });
  console.log('Ingest result:', await ingestRes.text());
}

main().catch(console.error);
