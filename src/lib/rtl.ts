// RTL Language Detection and Utilities

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'yi'];

export function isRTL(languageCode: string): boolean {
  return RTL_LANGUAGES.includes(languageCode);
}

export function getTextDirection(languageCode: string): 'rtl' | 'ltr' {
  return isRTL(languageCode) ? 'rtl' : 'ltr';
}

export function getFlexDirection(languageCode: string): 'row' | 'row-reverse' {
  return isRTL(languageCode) ? 'row-reverse' : 'row';
}

// Detect if text contains RTL characters
export function containsRTL(text: string): boolean {
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlChars.test(text);
}

// Detect if text contains LTR characters (Latin, numbers, etc.)
export function containsLTR(text: string): boolean {
  const ltrChars = /[A-Za-z0-9]/;
  return ltrChars.test(text);
}

// Get appropriate direction for mixed content
export function getContentDirection(text: string): 'rtl' | 'ltr' | 'auto' {
  if (!text) return 'ltr';
  return containsRTL(text) ? 'rtl' : 'ltr';
}

// Split mixed RTL/LTR text into separate lines
export function splitMixedText(text: string): Array<{ text: string; dir: 'rtl' | 'ltr' }> {
  if (!text) return [];
  
  // Check if text has both RTL and LTR
  const hasRTL = containsRTL(text);
  const hasLTR = containsLTR(text);
  
  // If only one direction, return as is
  if (!hasRTL || !hasLTR) {
    return [{ text, dir: hasRTL ? 'rtl' : 'ltr' }];
  }
  
  // Split by common separators that indicate language switch
  const parts: Array<{ text: string; dir: 'rtl' | 'ltr' }> = [];
  
  // Try to split by parentheses (common pattern: "English text (النص العربي)")
  const parenMatch = text.match(/^([^(]+)\(([^)]+)\)(.*)$/);
  if (parenMatch) {
    const [, before, inside, after] = parenMatch;
    if (before.trim()) parts.push({ text: before.trim(), dir: containsRTL(before) ? 'rtl' : 'ltr' });
    if (inside.trim()) parts.push({ text: inside.trim(), dir: containsRTL(inside) ? 'rtl' : 'ltr' });
    if (after.trim()) parts.push({ text: after.trim(), dir: containsRTL(after) ? 'rtl' : 'ltr' });
    return parts;
  }
  
  // Try to split by period followed by space
  const sentences = text.split(/\.\s+/);
  if (sentences.length > 1) {
    sentences.forEach((sentence, i) => {
      const trimmed = sentence.trim();
      if (trimmed) {
        // Add period back except for last sentence
        const withPeriod = i < sentences.length - 1 ? trimmed + '.' : trimmed;
        parts.push({ text: withPeriod, dir: containsRTL(trimmed) ? 'rtl' : 'ltr' });
      }
    });
    return parts;
  }
  
  // If no clear separator, return as single block with auto direction
  return [{ text, dir: hasRTL ? 'rtl' : 'ltr' }];
}

// Apply direction to element
export function applyDirection(element: HTMLElement | null, direction: 'rtl' | 'ltr' | 'auto') {
  if (element) {
    element.dir = direction;
  }
}
