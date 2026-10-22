// Explicitly supplied English copy is source content, not a request to rewrite it.
export function extractProvidedEnglishCopy(document) {
  const headings = [...document.matchAll(/^[ \t]*\*\*([^*\n]+)\*\*[ \t]*/gm)];
  const sections = new Map();
  for (let index = 0; index < headings.length; index++) {
    const heading = headings[index];
    const body = document.slice(heading.index + heading[0].length, headings[index + 1]?.index ?? document.length)
      .replace(/\\[ \t]*$/gm, '').trim();
    const label = heading[1];
    if (/English introduction/i.test(label)) {
      sections.set('introduction', body);
      continue;
    }
    const english = body.match(/(?:^|\n)[ \t]*English\s*[:：][ \t]*([\s\S]*?)(?=\n[ \t]*(?:中文|Chinese)\s*[:：]|$)/i)?.[1]?.trim();
    if (!english) continue;
    if (/Highlights/i.test(label)) sections.set('Highlights', english);
    else if (/Best For/i.test(label)) sections.set('Best For', english);
    else if (/Notes/i.test(label)) sections.set('Notes', english);
  }
  const description = [
    sections.get('introduction'),
    ...['Highlights', 'Best For', 'Notes'].map(label => sections.has(label) ? `${label}: ${sections.get(label)}` : ''),
  ].filter(Boolean).join('\n\n');
  return {
    ...(description ? { description } : {}),
  };
}
