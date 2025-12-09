// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>();
const pendingTranslations = new Map<string, Promise<string>>();

// Pre-fetch translations in the background
function preloadTranslation(text: string, targetLang: 'en' | 'es'): void {
  const cacheKey = `${text}_${targetLang}`;
  
  if (translationCache.has(cacheKey) || pendingTranslations.has(cacheKey)) {
    return;
  }

  const promise = fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      return response.json();
    })
    .then(data => {
      const translated = data.translatedText || text;
      translationCache.set(cacheKey, translated);
      pendingTranslations.delete(cacheKey);
      return translated;
    })
    .catch(error => {
      console.error('Translation error:', error);
      pendingTranslations.delete(cacheKey);
      return text;
    });

  pendingTranslations.set(cacheKey, promise);
}

export function translate(text: string, targetLang: 'en' | 'es'): string {
  if (targetLang === 'en') {
    return text;
  }
  
  const cacheKey = `${text}_${targetLang}`;
  
  // Return cached value if available
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }
  
  // Trigger background translation
  preloadTranslation(text, targetLang);
  
  // Return original text while translation loads
  return text;
}

export function translateMenuItem(name: string, targetLang: 'en' | 'es'): string {
  return translate(name, targetLang);
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
