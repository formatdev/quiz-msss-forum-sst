export type LanguageCode = 'fr' | 'de' | 'en';

export function withFallback(
  byLang: Partial<Record<LanguageCode, string>>,
  requested: LanguageCode
): string {
  return byLang[requested] ?? byLang.fr ?? '';
}

export function normalizeLanguage(input: string | undefined): LanguageCode {
  if (input === 'de' || input === 'en' || input === 'fr') {
    return input;
  }
  return 'fr';
}
