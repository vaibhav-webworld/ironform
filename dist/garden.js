const flowerColors = [
  { petal: '#ff83ad', shade: '#cf4e91', center: '#ffe6a3' },
  { petal: '#ffb771', shade: '#ee746b', center: '#fff2bd' },
  { petal: '#c8a5ff', shade: '#8e71df', center: '#f8de9d' },
  { petal: '#78d9d0', shade: '#3faca9', center: '#eff4b4' },
];

function flower(x, y, scale, colors) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cy="-7" rx="5" ry="9" fill="${colors.petal}"/>
    <ellipse cy="7" rx="5" ry="9" fill="${colors.shade}"/>
    <ellipse cx="-7" rx="9" ry="5" fill="${colors.petal}"/>
    <ellipse cx="7" rx="9" ry="5" fill="${colors.petal}"/>
    <circle r="4.5" fill="${colors.center}"/>
  </g>`;
}

function plant(x, y, scale, leafFill, blossom) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M0 0Q-6-32 1-66" fill="none" stroke="#8ed794" stroke-width="2.1"/>
    <path d="M-1-19Q-34-16-34-44Q-10-47-1-19ZM-2-34Q30-29 31-58Q6-58-2-34ZM0-49Q-19-52-20-72Q0-70 0-49Z" fill="${leafFill}"/>
    <path d="M-4-23-24-37M1-37l20-13M-2-53l-11-12" fill="none" stroke="#e6ffd6" stroke-opacity=".43" stroke-width="1.1"/>
    ${blossom ? flower(2, -69, 1.05, blossom) : `<path d="M1-65Q-10-82 6-91Q16-75 1-65Z" fill="${leafFill}"/>`}
  </g>`;
}

export function gardenArt(activeDays, large = false) {
  const id = large ? 'garden-full' : 'garden-preview';
  const growth = [];
  const dailyPlants = [];

  // Each training day adds a small shoot or flower through the first 30 days.
  for (let day = 0; day < Math.min(activeDays, 30); day++) {
    const row = Math.floor(day / 10);
    const column = (day * 7) % 10;
    const x = 53 + column * 29 + row * 6;
    const y = 169 + row * 7 + (column % 2) * 2;
    const height = 6 + (day % 4) * 2;
    const color = ['#75d88b', '#b9e98a', '#5dd1aa', '#8fd9ce'][day % 4];
    const bloom = day > 4 && day % 3 === 0 ? flower(x + 2, y - height, 0.28, flowerColors[day % 4]) : '';
    dailyPlants.push(`<g><path d="M${x} ${y}q-1-5 2-${height}" fill="none" stroke="${color}" stroke-width="1.4"/>
      <path d="M${x} ${y - 3}q-7 0-8-6q6-1 8 6m0 0q8 1 8-6q-6 0-8 6" fill="${color}"/>${bloom}</g>`);
  }

  if (activeDays >= 1) growth.push(plant(179, 166, .72, `url(#${id}-leaf)`));
  if (activeDays >= 3) growth.push(plant(114, 165, .9, `url(#${id}-fern)`));
  if (activeDays >= 7) growth.push(plant(262, 165, .94, `url(#${id}-fern)`, flowerColors[0]));
  if (activeDays >= 14) {
    growth.unshift(`<g transform="translate(215 165)">
      <path d="M0 0Q-7-42 0-111M-1-38l-38-41M-2-61l33-35" fill="none" stroke="#a08bc8" stroke-width="4"/>
      <path d="M-47-73C-79-80-64-117-36-116C-46-146-6-156 9-132C29-150 62-128 57-110C80-91 52-64 32-73C18-55-17-57-25-71C-36-65-44-67-47-73Z" fill="url(#${id}-canopy)"/>
      <path d="M-46-93q10-18 30-16m12-17q19-13 34 2m8 15q15 0 19 12M-17-82q18-16 37-10" fill="none" stroke="#f1d2ff" stroke-opacity=".42" stroke-width="2"/>
      ${flower(-31, -94, .34, flowerColors[2])}${flower(9, -120, .38, flowerColors[0])}${flower(40, -94, .32, flowerColors[2])}
    </g>`);
  }
  if (activeDays >= 30) {
    growth.push(plant(62, 171, .66, `url(#${id}-fern)`, flowerColors[1]));
    growth.push(plant(313, 170, .75, `url(#${id}-leaf)`, flowerColors[3]));
    const extraFlowers = Math.min(8, Math.floor((activeDays - 30) / 7));
    for (let i = 0; i < extraFlowers; i++) {
      growth.push(plant(83 + i * 30, 177, .35, `url(#${id}-fern)`, flowerColors[i % 4]));
    }
    for (let i = 0; i < (activeDays - 30) % 7; i++) {
      growth.push(`<circle cx="${131 + i * 24}" cy="${58 - (i % 3) * 12}" r="2" fill="${flowerColors[i % 4].center}"/>`);
    }
  }

  const description = activeDays
    ? `Colorful garden grown from ${activeDays} active ${activeDays === 1 ? 'day' : 'days'}`
    : 'A golden seed waiting for your first workout';
  return `<div class="garden-art${large ? ' large' : ''}"><svg viewBox="0 0 380 210" role="img" aria-label="${description}">
    <defs>
      <radialGradient id="${id}-halo"><stop stop-color="#406c83" stop-opacity=".49"/><stop offset="1" stop-color="#584272" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-ground" x2="0" y2="1"><stop stop-color="#44695d"/><stop offset="1" stop-color="#243e42"/></linearGradient>
      <linearGradient id="${id}-leaf" x2="1" y2="1"><stop stop-color="#c0ed83"/><stop offset="1" stop-color="#4dc489"/></linearGradient>
      <linearGradient id="${id}-fern" x2="1" y2="1"><stop stop-color="#83edc6"/><stop offset="1" stop-color="#299a88"/></linearGradient>
      <linearGradient id="${id}-canopy" x2="1" y2="1"><stop stop-color="#ed9fce"/><stop offset="1" stop-color="#736bd2"/></linearGradient>
    </defs>
    <ellipse cx="191" cy="114" rx="176" ry="103" fill="url(#${id}-halo)"/>
    <g fill="#f8dca2" opacity=".68"><circle cx="68" cy="98" r="1.4"/><circle cx="113" cy="47" r="1.7"/><circle cx="277" cy="39" r="1.5"/><circle cx="321" cy="92" r="1.7"/></g>
    <ellipse cx="190" cy="186" rx="164" ry="12" fill="#101b25" opacity=".65"/>
    <path d="M29 173Q53 153 123 156Q190 147 255 156Q325 155 350 173Q324 193 190 193Q57 193 29 173Z" fill="url(#${id}-ground)"/>
    <path d="M53 178Q116 187 163 182M232 186q51 0 89-10" fill="none" stroke="#78ad9c" stroke-opacity=".38"/>
    ${growth.join('')}${dailyPlants.join('')}
    ${activeDays === 0 ? '<ellipse cx="190" cy="172" rx="6.5" ry="3.7" transform="rotate(-25 190 172)" fill="#ffd793"/><path d="m190 162 0-7m-8 10-4-4m20 4 4-4" stroke="#ffdc9c" stroke-width="1.5" stroke-linecap="round"/>' : ''}
  </svg></div>`;
}
