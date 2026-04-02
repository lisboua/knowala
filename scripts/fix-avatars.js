const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');

const fixes = {
  // WOLF: separate tail from paw (move tail to left side), darken body for contrast with bg
  'wolf.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#455A64"/>
  <ellipse cx="60" cy="90" rx="22" ry="20" fill="#607D8B"/>
  <ellipse cx="60" cy="90" rx="16" ry="16" fill="#90A4AE"/>
  <path d="M28,88 Q16,72 12,82 Q18,92 26,90Z" fill="#607D8B"/>
  <ellipse cx="34" cy="82" rx="8" ry="5" fill="#607D8B" transform="rotate(-10 34 82)"/>
  <ellipse cx="86" cy="82" rx="8" ry="5" fill="#607D8B" transform="rotate(10 86 82)"/>
  <ellipse cx="60" cy="50" rx="26" ry="24" fill="#607D8B"/>
  <polygon points="34,16 42,40 26,38" fill="#607D8B"/>
  <polygon points="86,16 78,40 94,38" fill="#607D8B"/>
  <polygon points="36,20 40,38 28,36" fill="#90A4AE"/>
  <polygon points="84,20 80,38 92,36" fill="#90A4AE"/>
  <ellipse cx="60" cy="58" rx="16" ry="14" fill="#B0BEC5"/>
  <ellipse cx="46" cy="46" rx="4.5" ry="4" fill="#FFC107"/>
  <ellipse cx="74" cy="46" rx="4.5" ry="4" fill="#FFC107"/>
  <ellipse cx="46" cy="46" rx="2.5" ry="3" fill="#263238"/>
  <ellipse cx="74" cy="46" rx="2.5" ry="3" fill="#263238"/>
  <circle cx="47" cy="45" r="1" fill="white"/>
  <circle cx="75" cy="45" r="1" fill="white"/>
  <ellipse cx="60" cy="58" rx="5" ry="3.5" fill="#263238"/>
  <path d="M55,63 Q60,67 65,63" stroke="#37474F" stroke-width="1.2" fill="none"/>
</svg>`,

  // CAT: move tail to left side, away from right paw
  'cat.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#607D8B"/>
  <ellipse cx="60" cy="88" rx="20" ry="20" fill="#78909C"/>
  <ellipse cx="60" cy="88" rx="14" ry="15" fill="#B0BEC5"/>
  <path d="M28,88 Q18,72 12,80 Q18,92 26,92Z" fill="#78909C"/>
  <ellipse cx="34" cy="82" rx="6" ry="4" fill="#78909C" transform="rotate(-15 34 82)"/>
  <ellipse cx="86" cy="82" rx="6" ry="4" fill="#78909C" transform="rotate(15 86 82)"/>
  <ellipse cx="60" cy="50" rx="24" ry="22" fill="#78909C"/>
  <polygon points="36,18 44,40 28,38" fill="#78909C"/>
  <polygon points="84,18 76,40 92,38" fill="#78909C"/>
  <polygon points="38,22 42,38 30,36" fill="#F8BBD0"/>
  <polygon points="82,22 78,38 90,36" fill="#F8BBD0"/>
  <ellipse cx="60" cy="54" rx="16" ry="14" fill="#B0BEC5"/>
  <ellipse cx="49" cy="46" rx="5" ry="6" fill="#4CAF50"/>
  <ellipse cx="71" cy="46" rx="5" ry="6" fill="#4CAF50"/>
  <ellipse cx="49" cy="46" rx="3" ry="4.5" fill="#2D1B00"/>
  <ellipse cx="71" cy="46" rx="3" ry="4.5" fill="#2D1B00"/>
  <circle cx="50" cy="44.5" r="1.2" fill="white"/>
  <circle cx="72" cy="44.5" r="1.2" fill="white"/>
  <polygon points="60,53 57,57 63,57" fill="#F8BBD0"/>
  <path d="M57,59 Q60,62 63,59" stroke="#546E7A" stroke-width="1" fill="none"/>
  <line x1="32" y1="52" x2="48" y2="55" stroke="#546E7A" stroke-width="0.8"/>
  <line x1="32" y1="57" x2="48" y2="57" stroke="#546E7A" stroke-width="0.8"/>
  <line x1="72" y1="55" x2="88" y2="52" stroke="#546E7A" stroke-width="0.8"/>
  <line x1="72" y1="57" x2="88" y2="57" stroke="#546E7A" stroke-width="0.8"/>
</svg>`,

  // TREE: extend trunk upward to overlap with canopy, no gap
  'tree.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#43A047"/>
  <rect x="52" y="66" width="16" height="36" rx="3" fill="#5D4037"/>
  <rect x="48" y="98" width="24" height="6" rx="2" fill="#4E342E"/>
  <polygon points="60,8 24,52 96,52" fill="#2E7D32"/>
  <polygon points="60,22 18,68 102,68" fill="#388E3C"/>
  <polygon points="60,36 14,82 106,82" fill="#43A047"/>
  <ellipse cx="52" cy="52" rx="3.5" ry="4" fill="#1B5E20"/>
  <ellipse cx="68" cy="52" rx="3.5" ry="4" fill="#1B5E20"/>
  <circle cx="53" cy="51" r="1.2" fill="white"/>
  <circle cx="69" cy="51" r="1.2" fill="white"/>
  <path d="M55,60 Q60,64 65,60" stroke="#1B5E20" stroke-width="1.5" fill="none"/>
  <circle cx="46" cy="58" r="3" fill="#81C784" opacity="0.5"/>
  <circle cx="74" cy="58" r="3" fill="#81C784" opacity="0.5"/>
</svg>`,

  // RABBIT: darker bg for contrast, keep body light
  'rabbit.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#9CCC65"/>
  <ellipse cx="60" cy="92" rx="20" ry="18" fill="#EEEEEE"/>
  <ellipse cx="60" cy="92" rx="14" ry="14" fill="white"/>
  <ellipse cx="36" cy="86" rx="6" ry="4" fill="#EEEEEE" transform="rotate(-10 36 86)"/>
  <ellipse cx="84" cy="86" rx="6" ry="4" fill="#EEEEEE" transform="rotate(10 84 86)"/>
  <circle cx="60" cy="108" r="5" fill="white"/>
  <ellipse cx="60" cy="52" rx="22" ry="20" fill="#EEEEEE"/>
  <ellipse cx="44" cy="18" rx="10" ry="24" fill="#EEEEEE"/>
  <ellipse cx="76" cy="18" rx="10" ry="24" fill="#EEEEEE"/>
  <ellipse cx="44" cy="18" rx="6" ry="18" fill="#F8BBD0"/>
  <ellipse cx="76" cy="18" rx="6" ry="18" fill="#F8BBD0"/>
  <ellipse cx="60" cy="56" rx="14" ry="12" fill="white"/>
  <ellipse cx="48" cy="48" rx="4" ry="5" fill="#E91E63"/>
  <ellipse cx="72" cy="48" rx="4" ry="5" fill="#E91E63"/>
  <circle cx="49" cy="46.5" r="1.5" fill="white"/>
  <circle cx="73" cy="46.5" r="1.5" fill="white"/>
  <polygon points="60,55 57,59 63,59" fill="#F8BBD0"/>
  <path d="M56,61 Q60,64 64,61" stroke="#BDBDBD" stroke-width="1" fill="none"/>
  <circle cx="42" cy="58" r="4" fill="#F8BBD0" opacity="0.4"/>
  <circle cx="78" cy="58" r="4" fill="#F8BBD0" opacity="0.4"/>
</svg>`,

  // PENGUIN: lighter head so it contrasts with bg
  'penguin.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#81D4FA"/>
  <ellipse cx="60" cy="78" rx="28" ry="30" fill="#263238"/>
  <ellipse cx="60" cy="82" rx="18" ry="22" fill="white"/>
  <ellipse cx="32" cy="76" rx="10" ry="18" fill="#37474F" transform="rotate(10 32 76)"/>
  <ellipse cx="88" cy="76" rx="10" ry="18" fill="#37474F" transform="rotate(-10 88 76)"/>
  <ellipse cx="60" cy="42" rx="22" ry="20" fill="#263238"/>
  <ellipse cx="48" cy="40" rx="4" ry="4.5" fill="white"/>
  <ellipse cx="72" cy="40" rx="4" ry="4.5" fill="white"/>
  <ellipse cx="49" cy="40" rx="2.5" ry="3" fill="#263238"/>
  <ellipse cx="73" cy="40" rx="2.5" ry="3" fill="#263238"/>
  <circle cx="50" cy="39" r="1" fill="white"/>
  <circle cx="74" cy="39" r="1" fill="white"/>
  <polygon points="60,48 54,56 66,56" fill="#FF9800"/>
  <circle cx="42" cy="48" r="3.5" fill="#F8BBD0" opacity="0.35"/>
  <circle cx="78" cy="48" r="3.5" fill="#F8BBD0" opacity="0.35"/>
  <ellipse cx="48" cy="108" rx="8" ry="4" fill="#FF9800"/>
  <ellipse cx="72" cy="108" rx="8" ry="4" fill="#FF9800"/>
</svg>`,

  // KOALA: change bg to contrast with grey body
  'koala.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#A5D6A7"/>
  <ellipse cx="60" cy="90" rx="22" ry="20" fill="#78909C"/>
  <ellipse cx="60" cy="90" rx="16" ry="16" fill="#B0BEC5"/>
  <ellipse cx="34" cy="82" rx="8" ry="5" fill="#78909C" transform="rotate(-10 34 82)"/>
  <ellipse cx="86" cy="82" rx="8" ry="5" fill="#78909C" transform="rotate(10 86 82)"/>
  <ellipse cx="60" cy="50" rx="28" ry="26" fill="#78909C"/>
  <circle cx="30" cy="34" r="16" fill="#78909C"/>
  <circle cx="90" cy="34" r="16" fill="#78909C"/>
  <circle cx="30" cy="34" r="10" fill="#B0BEC5"/>
  <circle cx="90" cy="34" r="10" fill="#B0BEC5"/>
  <ellipse cx="60" cy="54" rx="18" ry="16" fill="#B0BEC5"/>
  <ellipse cx="46" cy="46" rx="8" ry="7" fill="#546E7A"/>
  <ellipse cx="74" cy="46" rx="8" ry="7" fill="#546E7A"/>
  <ellipse cx="46" cy="46" rx="4" ry="4.5" fill="#263238"/>
  <ellipse cx="74" cy="46" rx="4" ry="4.5" fill="#263238"/>
  <circle cx="47" cy="44.5" r="1.5" fill="white"/>
  <circle cx="75" cy="44.5" r="1.5" fill="white"/>
  <ellipse cx="60" cy="58" rx="6" ry="4.5" fill="#263238"/>
  <path d="M56,64 Q60,68 64,64" stroke="#546E7A" stroke-width="1.2" fill="none"/>
</svg>`,

  // DOG: change bg to contrast with orange body, add subtle outline
  'dog.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#8D6E63"/>
  <ellipse cx="60" cy="90" rx="22" ry="20" fill="#FFB74D" stroke="#E09940" stroke-width="1.5"/>
  <ellipse cx="60" cy="90" rx="16" ry="16" fill="#FFE0B2"/>
  <ellipse cx="34" cy="82" rx="8" ry="5" fill="#FFB74D" stroke="#E09940" stroke-width="1" transform="rotate(-15 34 82)"/>
  <ellipse cx="86" cy="82" rx="8" ry="5" fill="#FFB74D" stroke="#E09940" stroke-width="1" transform="rotate(15 86 82)"/>
  <path d="M80,86 Q92,76 96,88 Q90,94 84,92Z" fill="#FFB74D" stroke="#E09940" stroke-width="1"/>
  <ellipse cx="60" cy="50" rx="26" ry="24" fill="#FFB74D" stroke="#E09940" stroke-width="1.5"/>
  <ellipse cx="28" cy="34" rx="12" ry="18" fill="#C68A4D" transform="rotate(15 28 34)"/>
  <ellipse cx="92" cy="34" rx="12" ry="18" fill="#C68A4D" transform="rotate(-15 92 34)"/>
  <ellipse cx="60" cy="56" rx="16" ry="14" fill="#FFE0B2"/>
  <ellipse cx="48" cy="46" rx="4" ry="5" fill="#3E2723"/>
  <ellipse cx="72" cy="46" rx="4" ry="5" fill="#3E2723"/>
  <circle cx="49" cy="44.5" r="1.5" fill="white"/>
  <circle cx="73" cy="44.5" r="1.5" fill="white"/>
  <ellipse cx="60" cy="56" rx="5" ry="3.5" fill="#3E2723"/>
  <path d="M56,61 Q60,65 64,61" stroke="#3E2723" stroke-width="1.2" fill="none"/>
  <ellipse cx="60" cy="66" rx="5" ry="4" fill="#F48FB1"/>
</svg>`,

  // DEER: change bg to contrast with brown body, add outline
  'deer.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#A5D6A7"/>
  <ellipse cx="60" cy="92" rx="20" ry="18" fill="#8D6E63" stroke="#6D4C41" stroke-width="1.5"/>
  <ellipse cx="60" cy="92" rx="14" ry="14" fill="#D7CCC8"/>
  <ellipse cx="34" cy="86" rx="6" ry="4" fill="#8D6E63" stroke="#6D4C41" stroke-width="1" transform="rotate(-10 34 86)"/>
  <ellipse cx="86" cy="86" rx="6" ry="4" fill="#8D6E63" stroke="#6D4C41" stroke-width="1" transform="rotate(10 86 86)"/>
  <ellipse cx="60" cy="52" rx="24" ry="24" fill="#8D6E63" stroke="#6D4C41" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="30" y2="6" stroke="#5D4037" stroke-width="4" stroke-linecap="round"/>
  <line x1="30" y1="6" x2="20" y2="2" stroke="#5D4037" stroke-width="3" stroke-linecap="round"/>
  <line x1="30" y1="12" x2="24" y2="8" stroke="#5D4037" stroke-width="3" stroke-linecap="round"/>
  <line x1="80" y1="30" x2="90" y2="6" stroke="#5D4037" stroke-width="4" stroke-linecap="round"/>
  <line x1="90" y1="6" x2="100" y2="2" stroke="#5D4037" stroke-width="3" stroke-linecap="round"/>
  <line x1="90" y1="12" x2="96" y2="8" stroke="#5D4037" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="60" cy="56" rx="16" ry="16" fill="#D7CCC8"/>
  <ellipse cx="48" cy="48" rx="4" ry="5" fill="#3E2723"/>
  <ellipse cx="72" cy="48" rx="4" ry="5" fill="#3E2723"/>
  <circle cx="49" cy="46.5" r="1.5" fill="white"/>
  <circle cx="73" cy="46.5" r="1.5" fill="white"/>
  <ellipse cx="60" cy="60" rx="4" ry="3" fill="#3E2723"/>
  <path d="M56,65 Q60,69 64,65" stroke="#3E2723" stroke-width="1.2" fill="none"/>
</svg>`,

  // BEAR: change bg to contrast with brown body, add outline
  'bear.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#81C784"/>
  <ellipse cx="60" cy="90" rx="26" ry="22" fill="#795548" stroke="#5D4037" stroke-width="1.5"/>
  <ellipse cx="60" cy="90" rx="18" ry="16" fill="#A1887F"/>
  <ellipse cx="32" cy="80" rx="10" ry="6" fill="#795548" stroke="#5D4037" stroke-width="1" transform="rotate(-20 32 80)"/>
  <ellipse cx="88" cy="80" rx="10" ry="6" fill="#795548" stroke="#5D4037" stroke-width="1" transform="rotate(20 88 80)"/>
  <ellipse cx="60" cy="52" rx="26" ry="24" fill="#795548" stroke="#5D4037" stroke-width="1.5"/>
  <circle cx="36" cy="30" r="12" fill="#795548"/>
  <circle cx="84" cy="30" r="12" fill="#795548"/>
  <circle cx="36" cy="30" r="7" fill="#A1887F"/>
  <circle cx="84" cy="30" r="7" fill="#A1887F"/>
  <ellipse cx="60" cy="56" rx="16" ry="14" fill="#A1887F"/>
  <ellipse cx="48" cy="48" rx="4" ry="4.5" fill="#2D1B00"/>
  <ellipse cx="72" cy="48" rx="4" ry="4.5" fill="#2D1B00"/>
  <circle cx="49" cy="46.5" r="1.5" fill="white"/>
  <circle cx="73" cy="46.5" r="1.5" fill="white"/>
  <ellipse cx="60" cy="58" rx="5" ry="3.5" fill="#2D1B00"/>
  <path d="M55,63 Q60,67 65,63" stroke="#2D1B00" stroke-width="1.2" fill="none"/>
  <circle cx="42" cy="58" r="4" fill="#E8B4B8" opacity="0.4"/>
  <circle cx="78" cy="58" r="4" fill="#E8B4B8" opacity="0.4"/>
</svg>`,

  // BUTTERFLY: center body and wings symmetrically
  'butterfly.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#CE93D8"/>
  <ellipse cx="36" cy="42" rx="22" ry="26" fill="#E1BEE7" opacity="0.85" transform="rotate(-10 36 42)"/>
  <ellipse cx="84" cy="42" rx="22" ry="26" fill="#E1BEE7" opacity="0.85" transform="rotate(10 84 42)"/>
  <ellipse cx="36" cy="72" rx="16" ry="20" fill="#F3E5F5" opacity="0.75" transform="rotate(-5 36 72)"/>
  <ellipse cx="84" cy="72" rx="16" ry="20" fill="#F3E5F5" opacity="0.75" transform="rotate(5 84 72)"/>
  <circle cx="36" cy="40" r="6" fill="#AB47BC" opacity="0.5"/>
  <circle cx="84" cy="40" r="6" fill="#AB47BC" opacity="0.5"/>
  <circle cx="36" cy="70" r="5" fill="#CE93D8" opacity="0.5"/>
  <circle cx="84" cy="70" r="5" fill="#CE93D8" opacity="0.5"/>
  <ellipse cx="60" cy="64" rx="8" ry="24" fill="#8E24AA"/>
  <circle cx="60" cy="36" r="12" fill="#8E24AA"/>
  <circle cx="55" cy="34" r="3.5" fill="white"/>
  <circle cx="65" cy="34" r="3.5" fill="white"/>
  <circle cx="55" cy="34" r="2" fill="#263238"/>
  <circle cx="65" cy="34" r="2" fill="#263238"/>
  <circle cx="56" cy="33" r="0.8" fill="white"/>
  <circle cx="66" cy="33" r="0.8" fill="white"/>
  <path d="M54,26 Q50,16 44,12" stroke="#8E24AA" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M66,26 Q70,16 76,12" stroke="#8E24AA" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="44" cy="12" r="2.5" fill="#E1BEE7"/>
  <circle cx="76" cy="12" r="2.5" fill="#E1BEE7"/>
  <path d="M56,40 Q60,44 64,40" stroke="#E1BEE7" stroke-width="1.5" fill="none"/>
</svg>`,

  // BEE: remove 4 shadow balls at bottom
  'bee.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#FFC107"/>
  <ellipse cx="35" cy="52" rx="18" ry="12" fill="white" opacity="0.7" transform="rotate(-15 35 52)"/>
  <ellipse cx="85" cy="52" rx="18" ry="12" fill="white" opacity="0.7" transform="rotate(15 85 52)"/>
  <ellipse cx="60" cy="72" rx="22" ry="24" fill="#FDD835"/>
  <ellipse cx="60" cy="65" rx="22" ry="3" fill="#F57F17"/>
  <ellipse cx="60" cy="76" rx="20" ry="3" fill="#F57F17"/>
  <ellipse cx="60" cy="87" rx="16" ry="3" fill="#F57F17"/>
  <ellipse cx="60" cy="95" rx="8" ry="3" fill="#F57F17"/>
  <circle cx="60" cy="40" r="18" fill="#FDD835"/>
  <ellipse cx="52" cy="38" rx="4.5" ry="5" fill="#263238"/>
  <ellipse cx="68" cy="38" rx="4.5" ry="5" fill="#263238"/>
  <circle cx="53" cy="36.5" r="1.8" fill="white"/>
  <circle cx="69" cy="36.5" r="1.8" fill="white"/>
  <line x1="52" y1="24" x2="45" y2="12" stroke="#263238" stroke-width="2" stroke-linecap="round"/>
  <line x1="68" y1="24" x2="75" y2="12" stroke="#263238" stroke-width="2" stroke-linecap="round"/>
  <circle cx="45" cy="12" r="3" fill="#263238"/>
  <circle cx="75" cy="12" r="3" fill="#263238"/>
  <path d="M54,46 Q60,51 66,46" stroke="#263238" stroke-width="1.5" fill="none"/>
</svg>`,
};

for (const [filename, content] of Object.entries(fixes)) {
  const filePath = path.join(avatarsDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Fixed ${filename}`);
}

console.log(`\nDone! Fixed ${Object.keys(fixes).length} avatars.`);
