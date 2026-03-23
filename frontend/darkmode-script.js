const fs = require('fs');

let c = fs.readFileSync('src/pages/Equipamentos.tsx', 'utf8');

c = c.replace(/className="max-w-7xl mx-auto space-y-6 animate-fade-in text-white h-full flex flex-col relative"/, 'className="max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-900 dark:text-white h-full flex flex-col relative transition-colors duration-200"');
c = c.replace(/text-gray-400 mt-1/g, 'text-gray-500 dark:text-gray-400 mt-1');
c = c.replace(/bg-surface border border-\[\#1f2937\]/g, 'bg-white dark:bg-surface border border-gray-200 dark:border-[#1f2937]');
c = c.replace(/border-b border-\[\#1f2937\]/g, 'border-b border-gray-200 dark:border-[#1f2937]');
c = c.replace(/divide-\[\#1f2937\]/g, 'divide-gray-200 dark:divide-[#1f2937]');
c = c.replace(/bg-\[\#111827\] border border-\[\#374151\]/g, 'bg-gray-50 dark:bg-[#111827] border border-gray-300 dark:border-[#374151]');
c = c.replace(/text-white focus:outline-none/g, 'text-gray-900 dark:text-white focus:outline-none');
c = c.replace(/hover:border-gray-500/g, 'hover:border-gray-400 dark:hover:border-gray-500');
c = c.replace(/text-gray-300 flex items-center/g, 'text-gray-700 dark:text-gray-300 flex items-center');
c = c.replace(/hover:bg-\[\#1f2937\]/g, 'hover:bg-gray-100 dark:hover:bg-[#1f2937]');
c = c.replace(/bg-\[\#0b101a\] text-gray-400/g, 'bg-gray-50 dark:bg-[#0b101a] text-gray-500 dark:text-gray-400');
c = c.replace(/hover:bg-\[\#1f2937\]\/30/g, 'hover:bg-gray-50 dark:hover:bg-[#1f2937]/30');
c = c.replace(/font-medium text-white/g, 'font-medium text-gray-900 dark:text-white');
c = c.replace(/hover:text-white/g, 'hover:text-gray-900 dark:hover:text-white');
c = c.replace(/hover:bg-white\/5/g, 'hover:bg-gray-200 dark:hover:bg-white/5');
c = c.replace(/text-xl font-bold text-white/g, 'text-xl font-bold text-gray-900 dark:text-white');
c = c.replace(/border-t border-\[\#1f2937\]/g, 'border-t border-gray-200 dark:border-[#1f2937]');
c = c.replace(/text-gray-300 mb-1\.5/g, 'text-gray-700 dark:text-gray-300 mb-1.5');
c = c.replace(/text-sm text-gray-300/g, 'text-sm text-gray-700 dark:text-gray-300');

fs.writeFileSync('src/pages/Equipamentos.tsx', c);
