const vowels = ['aāáǎà', 'eēéěè', 'iīíǐì', 'oōóǒò', 'uūúǔù', 'üǖǘǚǜ'];

export function normalizePinyin(value: string) {
  const input = value.trim().toLowerCase().normalize('NFC').replace(/u:|v/g, 'ü');
  const digit = input.match(/[0-5]$/)?.[0];
  let tone = digit === '0' ? 5 : Number(digit || 0), marks = 0;
  let valid = /^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+[0-5]?$/.test(input);
  let base = input.replace(/[0-5]$/, '');
  for (const row of vowels) for (let i = 1; i <= 4; i++) {
    if (base.includes(row[i])) { marks += base.split(row[i]).length - 1; if (digit && tone !== i) valid = false; tone = i; base = base.replaceAll(row[i], row[0]); }
  }
  return { base, tone, valid: valid && marks <= 1 };
}

export function toneMark(value: string) {
  const { base, tone } = normalizePinyin(value);
  if (!tone || tone === 5) return base;
  const index = base.includes('a') ? base.indexOf('a') : base.includes('e') ? base.indexOf('e') : base.includes('ou') ? base.indexOf('o') : Math.max(...vowels.map(row => base.lastIndexOf(row[0])));
  const row = vowels.find(row => row[0] === base[index]);
  return row ? base.slice(0, index) + row[tone] + base.slice(index + 1) : base;
}

export function gradePinyin(value: string, expected: string, strict: boolean) {
  const actual = normalizePinyin(value), target = normalizePinyin(expected);
  return actual.valid && actual.base === target.base && (actual.tone === target.tone || (!strict && actual.tone === 0));
}
