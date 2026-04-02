const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');

const fixes = {
  // OWL: bg teal #80CBC4 to contrast brown body, add strokes
  'owl.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#80CBC4"/>
  <ellipse cx="60" cy="88" rx="24" ry="20" fill="#5C3D2A" stroke="#3E2723" stroke-width="1.5"/>
  <ellipse cx="60" cy="88" rx="18" ry="16" fill="#D2B48C"/>
  <ellipse cx="28" cy="75" rx="14" ry="22" fill="#5C3D2A" stroke="#3E2723" stroke-width="1" transform="rotate(-10 28 75)"/>
  <ellipse cx="92" cy="75" rx="14" ry="22" fill="#5C3D2A" stroke="#3E2723" stroke-width="1" transform="rotate(10 92 75)"/>
  <ellipse cx="60" cy="46" rx="26" ry="24" fill="#8B5E3C" stroke="#5C3D2A" stroke-width="1.5"/>
  <polygon points="36,18 42,36 30,34" fill="#5C3D2A"/>
  <polygon points="84,18 78,36 90,34" fill="#5C3D2A"/>
  <ellipse cx="60" cy="48" rx="20" ry="18" fill="#F5DEB3"/>
  <circle cx="50" cy="44" r="10" fill="white"/>
  <circle cx="70" cy="44" r="10" fill="white"/>
  <circle cx="51" cy="44" r="5.5" fill="#2D1B00"/>
  <circle cx="71" cy="44" r="5.5" fill="#2D1B00"/>
  <circle cx="52.5" cy="42.5" r="2" fill="white"/>
  <circle cx="72.5" cy="42.5" r="2" fill="white"/>
  <polygon points="60,52 55,60 65,60" fill="#FF9800"/>
  <ellipse cx="50" cy="106" rx="6" ry="3" fill="#FF9800"/>
  <ellipse cx="70" cy="106" rx="6" ry="3" fill="#FF9800"/>
</svg>`,

  // PANDA: bg light blue #81D4FA so black arms/ears visible, add stroke on white body
  'panda.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#81D4FA"/>
  <ellipse cx="60" cy="90" rx="24" ry="20" fill="white" stroke="#BDBDBD" stroke-width="1.5"/>
  <ellipse cx="34" cy="78" rx="12" ry="8" fill="#263238" stroke="#1a1a1a" stroke-width="1" transform="rotate(-10 34 78)"/>
  <ellipse cx="86" cy="78" rx="12" ry="8" fill="#263238" stroke="#1a1a1a" stroke-width="1" transform="rotate(10 86 78)"/>
  <ellipse cx="60" cy="48" rx="26" ry="24" fill="white" stroke="#BDBDBD" stroke-width="1.5"/>
  <circle cx="36" cy="28" r="12" fill="#263238" stroke="#1a1a1a" stroke-width="1"/>
  <circle cx="84" cy="28" r="12" fill="#263238" stroke="#1a1a1a" stroke-width="1"/>
  <ellipse cx="46" cy="44" rx="12" ry="10" fill="#263238"/>
  <ellipse cx="74" cy="44" rx="12" ry="10" fill="#263238"/>
  <ellipse cx="46" cy="44" rx="5" ry="5.5" fill="white"/>
  <ellipse cx="74" cy="44" rx="5" ry="5.5" fill="white"/>
  <ellipse cx="47" cy="43.5" rx="3" ry="3.5" fill="#263238"/>
  <ellipse cx="75" cy="43.5" rx="3" ry="3.5" fill="#263238"/>
  <circle cx="48" cy="42.5" r="1.2" fill="white"/>
  <circle cx="76" cy="42.5" r="1.2" fill="white"/>
  <ellipse cx="60" cy="56" rx="4.5" ry="3.5" fill="#263238"/>
  <path d="M56,61 Q60,65 64,61" stroke="#BDBDBD" stroke-width="1.2" fill="none"/>
  <circle cx="42" cy="56" r="4" fill="#F8BBD0" opacity="0.35"/>
  <circle cx="78" cy="56" r="4" fill="#F8BBD0" opacity="0.35"/>
</svg>`,

  // FOX: bg light blue #90CAF9 to contrast orange body, add strokes
  'fox.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#90CAF9"/>
  <ellipse cx="60" cy="90" rx="22" ry="18" fill="#FF8C5A" stroke="#E65100" stroke-width="1.5"/>
  <ellipse cx="60" cy="90" rx="16" ry="14" fill="#FFE0D0"/>
  <path d="M82,82 Q105,62 95,47 Q90,52 85,67 Q82,74 82,82Z" fill="#FF8C5A" stroke="#E65100" stroke-width="1"/>
  <path d="M92,52 Q88,57 86,67" stroke="#FFE0D0" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="52" rx="24" ry="22" fill="#FF8C5A" stroke="#E65100" stroke-width="1.5"/>
  <polygon points="38,22 46,42 30,40" fill="#FF8C5A"/>
  <polygon points="82,22 74,42 90,40" fill="#FF8C5A"/>
  <polygon points="40,26 44,40 34,38" fill="#FFE0D0"/>
  <polygon points="80,26 76,40 86,38" fill="#FFE0D0"/>
  <ellipse cx="60" cy="56" rx="16" ry="14" fill="#FFE0D0"/>
  <ellipse cx="50" cy="48" rx="3.5" ry="4" fill="#2D1B00"/>
  <ellipse cx="70" cy="48" rx="3.5" ry="4" fill="#2D1B00"/>
  <circle cx="51" cy="47" r="1.3" fill="white"/>
  <circle cx="71" cy="47" r="1.3" fill="white"/>
  <ellipse cx="60" cy="56" rx="4" ry="3" fill="#2D1B00"/>
  <path d="M56,60 Q60,64 64,60" stroke="#2D1B00" stroke-width="1.2" fill="none"/>
</svg>`,

  // WOLF: bg purple #B39DDB to contrast grey body, add strokes
  'wolf.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#B39DDB"/>
  <ellipse cx="60" cy="90" rx="22" ry="20" fill="#607D8B" stroke="#37474F" stroke-width="1.5"/>
  <ellipse cx="60" cy="90" rx="16" ry="16" fill="#90A4AE"/>
  <path d="M28,88 Q16,72 12,82 Q18,92 26,90Z" fill="#607D8B" stroke="#37474F" stroke-width="1"/>
  <ellipse cx="34" cy="82" rx="8" ry="5" fill="#607D8B" stroke="#37474F" stroke-width="1" transform="rotate(-10 34 82)"/>
  <ellipse cx="86" cy="82" rx="8" ry="5" fill="#607D8B" stroke="#37474F" stroke-width="1" transform="rotate(10 86 82)"/>
  <ellipse cx="60" cy="50" rx="26" ry="24" fill="#607D8B" stroke="#37474F" stroke-width="1.5"/>
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

  // CAT: bg warm pink #F48FB1 to contrast grey body, add strokes
  'cat.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#F48FB1"/>
  <ellipse cx="60" cy="88" rx="20" ry="20" fill="#78909C" stroke="#455A64" stroke-width="1.5"/>
  <ellipse cx="60" cy="88" rx="14" ry="15" fill="#B0BEC5"/>
  <path d="M28,88 Q18,72 12,80 Q18,92 26,92Z" fill="#78909C" stroke="#455A64" stroke-width="1"/>
  <ellipse cx="34" cy="82" rx="6" ry="4" fill="#78909C" stroke="#455A64" stroke-width="1" transform="rotate(-15 34 82)"/>
  <ellipse cx="86" cy="82" rx="6" ry="4" fill="#78909C" stroke="#455A64" stroke-width="1" transform="rotate(15 86 82)"/>
  <ellipse cx="60" cy="50" rx="24" ry="22" fill="#78909C" stroke="#455A64" stroke-width="1.5"/>
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

  // TURTLE: bg blue #90CAF9 to contrast green body, add strokes
  'turtle.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#90CAF9"/>
  <ellipse cx="60" cy="72" rx="34" ry="26" fill="#2E7D32" stroke="#1B5E20" stroke-width="1.5"/>
  <ellipse cx="60" cy="72" rx="30" ry="22" fill="#388E3C"/>
  <path d="M60,50 L48,72 L60,94" stroke="#2E7D32" stroke-width="2" fill="none"/>
  <path d="M60,50 L72,72 L60,94" stroke="#2E7D32" stroke-width="2" fill="none"/>
  <line x1="30" y1="72" x2="90" y2="72" stroke="#2E7D32" stroke-width="2"/>
  <ellipse cx="30" cy="86" rx="8" ry="5" fill="#81C784" stroke="#4CAF50" stroke-width="1" transform="rotate(-20 30 86)"/>
  <ellipse cx="90" cy="86" rx="8" ry="5" fill="#81C784" stroke="#4CAF50" stroke-width="1" transform="rotate(20 90 86)"/>
  <ellipse cx="36" cy="96" rx="7" ry="5" fill="#81C784" stroke="#4CAF50" stroke-width="1" transform="rotate(-10 36 96)"/>
  <ellipse cx="84" cy="96" rx="7" ry="5" fill="#81C784" stroke="#4CAF50" stroke-width="1" transform="rotate(10 84 96)"/>
  <ellipse cx="60" cy="40" rx="16" ry="14" fill="#81C784" stroke="#4CAF50" stroke-width="1.5"/>
  <ellipse cx="52" cy="36" rx="3.5" ry="4" fill="#1B5E20"/>
  <ellipse cx="68" cy="36" rx="3.5" ry="4" fill="#1B5E20"/>
  <circle cx="53" cy="35" r="1.2" fill="white"/>
  <circle cx="69" cy="35" r="1.2" fill="white"/>
  <path d="M55,44 Q60,48 65,44" stroke="#1B5E20" stroke-width="1.2" fill="none"/>
</svg>`,

  // FROG: bg warm yellow #FFF176 to contrast green body, add strokes
  'frog.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#FFF176"/>
  <ellipse cx="60" cy="78" rx="28" ry="24" fill="#81C784" stroke="#4CAF50" stroke-width="1.5"/>
  <ellipse cx="60" cy="80" rx="20" ry="18" fill="#C8E6C9"/>
  <ellipse cx="34" cy="90" rx="10" ry="5" fill="#81C784" stroke="#4CAF50" stroke-width="1" transform="rotate(-10 34 90)"/>
  <ellipse cx="86" cy="90" rx="10" ry="5" fill="#81C784" stroke="#4CAF50" stroke-width="1" transform="rotate(10 86 90)"/>
  <ellipse cx="34" cy="100" rx="12" ry="4" fill="#4CAF50"/>
  <ellipse cx="86" cy="100" rx="12" ry="4" fill="#4CAF50"/>
  <circle cx="30" cy="100" r="3" fill="#4CAF50"/>
  <circle cx="38" cy="100" r="3" fill="#4CAF50"/>
  <circle cx="82" cy="100" r="3" fill="#4CAF50"/>
  <circle cx="90" cy="100" r="3" fill="#4CAF50"/>
  <ellipse cx="60" cy="48" rx="24" ry="20" fill="#81C784" stroke="#4CAF50" stroke-width="1.5"/>
  <ellipse cx="40" cy="32" rx="12" ry="12" fill="#81C784" stroke="#4CAF50" stroke-width="1"/>
  <ellipse cx="80" cy="32" rx="12" ry="12" fill="#81C784" stroke="#4CAF50" stroke-width="1"/>
  <ellipse cx="40" cy="32" rx="9" ry="9" fill="white"/>
  <ellipse cx="80" cy="32" rx="9" ry="9" fill="white"/>
  <circle cx="42" cy="32" r="5.5" fill="#1B5E20"/>
  <circle cx="82" cy="32" r="5.5" fill="#1B5E20"/>
  <circle cx="43.5" cy="30.5" r="2" fill="white"/>
  <circle cx="83.5" cy="30.5" r="2" fill="white"/>
  <path d="M48,58 Q60,68 72,58" stroke="#2E7D32" stroke-width="2" fill="none"/>
  <circle cx="40" cy="52" r="4" fill="#E8F5E9" opacity="0.5"/>
  <circle cx="80" cy="52" r="4" fill="#E8F5E9" opacity="0.5"/>
</svg>`,

  // BEE: bg sky blue #81D4FA to contrast yellow body, add strokes
  'bee.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#81D4FA"/>
  <ellipse cx="35" cy="52" rx="18" ry="12" fill="white" opacity="0.7" transform="rotate(-15 35 52)"/>
  <ellipse cx="85" cy="52" rx="18" ry="12" fill="white" opacity="0.7" transform="rotate(15 85 52)"/>
  <ellipse cx="60" cy="72" rx="22" ry="24" fill="#FDD835" stroke="#F9A825" stroke-width="1.5"/>
  <ellipse cx="60" cy="65" rx="22" ry="3" fill="#F57F17"/>
  <ellipse cx="60" cy="76" rx="20" ry="3" fill="#F57F17"/>
  <ellipse cx="60" cy="87" rx="16" ry="3" fill="#F57F17"/>
  <ellipse cx="60" cy="95" rx="8" ry="3" fill="#F57F17"/>
  <circle cx="60" cy="40" r="18" fill="#FDD835" stroke="#F9A825" stroke-width="1.5"/>
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

  // TREE: bg sky blue #81D4FA, add stroke on canopy layers
  'tree.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#81D4FA"/>
  <rect x="52" y="66" width="16" height="36" rx="3" fill="#5D4037"/>
  <rect x="48" y="98" width="24" height="6" rx="2" fill="#4E342E"/>
  <polygon points="60,8 24,52 96,52" fill="#2E7D32" stroke="#1B5E20" stroke-width="1"/>
  <polygon points="60,22 18,68 102,68" fill="#388E3C" stroke="#2E7D32" stroke-width="1"/>
  <polygon points="60,36 14,82 106,82" fill="#43A047" stroke="#388E3C" stroke-width="1"/>
  <ellipse cx="52" cy="52" rx="3.5" ry="4" fill="#1B5E20"/>
  <ellipse cx="68" cy="52" rx="3.5" ry="4" fill="#1B5E20"/>
  <circle cx="53" cy="51" r="1.2" fill="white"/>
  <circle cx="69" cy="51" r="1.2" fill="white"/>
  <path d="M55,60 Q60,64 65,60" stroke="#1B5E20" stroke-width="1.5" fill="none"/>
  <circle cx="46" cy="58" r="3" fill="#81C784" opacity="0.5"/>
  <circle cx="74" cy="58" r="3" fill="#81C784" opacity="0.5"/>
</svg>`,

  // BUTTERFLY: bg light cyan #B2EBF2 to contrast purple, add strokes on wings
  'butterfly.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="60" fill="#B2EBF2"/>
  <ellipse cx="36" cy="42" rx="22" ry="26" fill="#E1BEE7" stroke="#CE93D8" stroke-width="1.5" opacity="0.9" transform="rotate(-10 36 42)"/>
  <ellipse cx="84" cy="42" rx="22" ry="26" fill="#E1BEE7" stroke="#CE93D8" stroke-width="1.5" opacity="0.9" transform="rotate(10 84 42)"/>
  <ellipse cx="36" cy="72" rx="16" ry="20" fill="#F3E5F5" stroke="#CE93D8" stroke-width="1" opacity="0.85" transform="rotate(-5 36 72)"/>
  <ellipse cx="84" cy="72" rx="16" ry="20" fill="#F3E5F5" stroke="#CE93D8" stroke-width="1" opacity="0.85" transform="rotate(5 84 72)"/>
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
};

for (const [filename, content] of Object.entries(fixes)) {
  const filePath = path.join(avatarsDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Fixed ${filename}`);
}

console.log(`\nDone! Fixed ${Object.keys(fixes).length} avatars.`);
