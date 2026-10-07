/**
 * Quick setup script — run this ONCE in Node.js to verify your
 * Google Apps Script webhook is working.
 * 
 * Usage:
 *   node scripts/test-sheet-webhook.js <YOUR_WEBHOOK_URL>
 * 
 * Example:
 *   node scripts/test-sheet-webhook.js "https://script.google.com/macros/s/AKfycb.../exec"
 */

const webhookUrl = process.argv[2];

if (!webhookUrl) {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  INTELLETTO-26 — Google Sheet Webhook Test                      ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Usage:                                                          ║
║    node scripts/test-sheet-webhook.js <WEBHOOK_URL>              ║
║                                                                  ║
║  You need to deploy the Apps Script first. See:                  ║
║    scripts/google-sheets-apps-script.js                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

const testData = {
  timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }),
  player_tag: 'IN26-TEST',
  full_name: 'Test Student',
  email: 'test.student@example.com',
  phone: '9876543210',
  alternate_phone: '',
  college: 'Test Engineering College',
  department: 'Computer Science',
  year_of_study: '3rd Year',
  city: 'Chennai',
  state: 'Tamil Nadu',
  emergency_contact: 'Parent - 9876543211',
  events: 'Squid Game, Quest of Mind',
  team_name: 'Night Owls',
  team_size: '2',
  teammates: 'Teammate One',
  status: 'confirmed',
  transaction_ids: '',
  upi_ids: '',
  proof_names: '',
};

console.log('\n📤 Sending test registration to Google Sheet...\n');
console.log('Webhook URL:', webhookUrl);
console.log('Test Data:', JSON.stringify(testData, null, 2));

fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData),
  redirect: 'follow',
})
  .then(async (res) => {
    const text = await res.text();
    console.log(`\n✅ Response (${res.status}):`, text);
    if (res.ok) {
      console.log('\n🎉 SUCCESS! Check your Google Sheet — a test row should appear.');
      console.log('📋 Sheet: https://docs.google.com/spreadsheets/d/1YNq_7hz2QUfI0XkadtZlS_nWfR3_ThKgeJBW2Ohl72U/edit');
    }
  })
  .catch((err) => {
    console.error('\n❌ Error:', err.message);
  });
