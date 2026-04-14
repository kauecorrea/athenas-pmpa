const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/Vtr.tsx', 'utf8');

const lines = content.split('\n');
const stack = [];
const selfClosingTags = ['img', 'input', 'br', 'hr', 'link', 'meta', 'Plus', 'Search', 'FileText', 'Calendar', 'CheckCircle2', 'X', 'Trash2', 'Car', 'List', 'ShieldOff', 'Shield', 'ChevronDown', 'Edit2'];

lines.forEach((line, i) => {
    const lineNumber = i + 1;
    const tagRegex = /<(\/?[a-zA-Z0-9]+)(\s|>)/g;
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
        let tag = match[1];
        // Check if it's self-closing (ends with /> in the same line)
        const partOfLine = line.substring(match.index);
        if (partOfLine.includes('/>') && !partOfLine.includes('<' + tag + '>') && partOfLine.indexOf('/>') < partOfLine.indexOf('<', 1) || selfClosingTags.includes(tag)) {
            if (!tag.startsWith('/')) continue;
        }

        if (tag.startsWith('/')) {
            const last = stack.pop();
            if (last && last.tag !== tag.substring(1)) {
                console.log(`Mismatch at L${lineNumber}: found </${tag.substring(1)}>, expected </${last.tag}> (from L${last.line})`);
            }
        } else {
            stack.push({ tag, line: lineNumber });
        }
    }
});

console.log('Unclosed tags:', stack);
