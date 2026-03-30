const fs = require('fs');
const path = require('path');
const files = ['index.html','contact.html','shop.html','lookbook.html','about.html','product.html','cart.html','shipping.html','terms.html','faq.html'];
const replacements = [
  {
    from: /<li class="relative group">/g,
    to: '<li class="relative group flex flex-col items-center">'
  },
  {
    from: /<div class="absolute right-0 top-full w-48 h-2 bg-transparent pointer-events-auto"><\/div>/g,
    to: '<div class="absolute left-1/2 top-full w-48 h-2 -translate-x-1/2 bg-transparent pointer-events-auto"></div>'
  },
  {
    from: /<div class="absolute right-0 top-full mt-1 w-48 z-50 bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">/g,
    to: '<div class="absolute left-1/2 top-full mt-1 w-48 min-w-[160px] -translate-x-1/2 z-[999] bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">'
  },
  {
    from: /class="block w-full text-left px-4 py-3 text-\[10px\] uppercase tracking-widest font-bold border-b border-zinc-800 hover:bg-fof-accent hover:text-white transition-colors"/g,
    to: 'class="block w-full text-left px-4 py-3 text-sm font-medium text-white border-b border-zinc-800 hover:bg-zinc-800 transition-colors"'
  },
  {
    from: /class="w-full text-left px-4 py-3 text-\[10px\] uppercase tracking-widest font-bold hover:bg-fof-accent hover:text-white transition-colors"/g,
    to: 'class="block w-full text-left px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"'
  },
  {
    from: /class="text-\[10px\] uppercase tracking-widest font-bold text-fof-accent flex items-center"/g,
    to: 'class="text-sm font-semibold text-fof-accent flex items-center space-x-2"'
  }
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  let text = fs.readFileSync(filePath, 'utf8');
  let original = text;
  for (const { from, to } of replacements) {
    text = text.replace(from, to);
  }
  if (text !== original) {
    fs.writeFileSync(filePath, text, 'utf8');
    console.log('Updated', file);
  }
}
