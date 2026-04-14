const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/Vtr.tsx', 'utf8');

const tags = [];
const regex = /<(\/?[a-zA-Z0-9]+)(\s|>)/g;
let match;
while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    if (tag.toLowerCase() === 'img' || tag.toLowerCase() === 'input' || tag.toLowerCase() === 'br' || tag.toLowerCase() === 'hr') continue;
    
    if (tag.startsWith('/')) {
        const expected = tags.pop();
        if (expected !== tag.substring(1)) {
            console.log(`Mismatch: found </${tag.substring(1)}>, expected </${expected}>`);
        }
    } else {
        tags.push(tag);
    }
}
console.log('Unclosed tags at EOF:', tags);
