const response = await fetch('https://pdfaid.com/compress-pdf');
const data = await response.text();

// Extract title
const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
console.log("Compress Title:", titleMatch ? titleMatch[1] : 'Not found');

// Extract description
const descMatch = data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
console.log("Compress Meta Desc:", descMatch ? descMatch[1] : 'Not found');

// Extract H1 tags
const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
let match;
while ((match = h1Regex.exec(data)) !== null) {
  console.log("Compress H1:", match[1].replace(/<[^>]+>/g, '').trim());
}

// Extract canonical
const canonical = data.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
console.log("Canonical:", canonical ? canonical[1] : 'Not found');

// Extract json schema
const jsonLdMatch = data.match(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
if (jsonLdMatch) {
  console.log("\nFound JSON-LD Schema");
  try {
     const parsed = JSON.parse(jsonLdMatch[1]);
     console.log(JSON.stringify(parsed, null, 2).substring(0, 500) + '...');
  } catch(e) {}
}

// Check text content structure length
console.log("Total HTML length:", data.length);
