const response = await fetch('https://pdfaid.com/');
const data = await response.text();

// Extract title
const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
console.log("Title:", titleMatch ? titleMatch[1] : 'Not found');

// Extract description
const descMatch = data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
console.log("Meta Description:", descMatch ? descMatch[1] : 'Not found');

// Extract keywords
const kwMatch = data.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
console.log("Meta Keywords:", kwMatch ? kwMatch[1] : 'Not found');

// Extract H1 tags
console.log("\nH1 tags:");
const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
let match;
while ((match = h1Regex.exec(data)) !== null) {
  console.log(" -", match[1].replace(/<[^>]+>/g, '').trim());
}

// Extract hreflang
console.log("\nHreflang links:");
const hrefLangRegex = /<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
while ((match = hrefLangRegex.exec(data)) !== null) {
  console.log(" - Lang:", match[1], "URL:", match[2]);
}

// Check JSON-LD
const jsonLdMatch = data.match(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
if (jsonLdMatch) {
  console.log("\nFound JSON-LD Schema");
  try {
     const parsed = JSON.parse(jsonLdMatch[1]);
     console.log("Schema Types:", Array.isArray(parsed) ? parsed.map(p => p['@type']) : parsed['@type']);
  } catch(e) {}
}

console.log("\nOther meta tags:");
const metaRegex = /<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi;
while ((match = metaRegex.exec(data)) !== null) {
  console.log(` - og:${match[1]}: ${match[2]}`);
}
