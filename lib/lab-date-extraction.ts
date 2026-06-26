export function inferLabResultDate(text: string): string | undefined {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return (
    findContextDate(normalized, /\b(date\/time collected|date collected|collected date|collection date|specimen collected|draw date|drawn)\b/i) ??
    findContextDate(normalized, /\b(date\/time reported|reported date|date reported|resulted date|date resulted)\b/i) ??
    findContextDate(normalized, /\b(received on|date received)\b/i)
  );
}

function findContextDate(text: string, pattern: RegExp) {
  const match = pattern.exec(text);
  if (!match || match.index < 0) return undefined;

  const windowText = text.slice(match.index, match.index + 220);
  const iso = windowText.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const slash = windowText.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (slash) {
    const month = slash[1].padStart(2, '0');
    const day = slash[2].padStart(2, '0');
    return `${slash[3]}-${month}-${day}`;
  }

  return undefined;
}
