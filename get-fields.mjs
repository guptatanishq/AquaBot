const token = process.env.CLICKUP_API_TOKEN;
const listId = process.env.CLICKUP_LIST_ID;

if (!token || !listId) {
  console.error("Missing CLICKUP_API_TOKEN or CLICKUP_LIST_ID in environment.");
  process.exit(1);
}

async function fetchFields() {
  const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/field`, {
    method: 'GET',
    headers: { 'Authorization': token }
  });

  if (!response.ok) {
    console.error("Failed to fetch fields:", await response.text());
    return;
  }

  const data = await response.json();
  console.log("\n--- ClickUp Custom Fields Found ---");
  data.fields.forEach(f => {
    console.log(`Name: ${f.name} | ID: ${f.id} | Type: ${f.type}`);
  });
  console.log("----------------------------------\n");
}

fetchFields();
