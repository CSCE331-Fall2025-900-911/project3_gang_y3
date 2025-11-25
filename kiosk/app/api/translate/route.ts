import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing text or targetLang' },
        { status: 400 }
      );
    }

    const instances = [
      'https://libretranslate.de/translate',
      'https://translate.argosopentech.com/translate',
      'https://libretranslate.com/translate',
    ];

    let lastError = null;

    for (const apiUrl of instances) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: 'en',
            target: targetLang === 'es' ? 'es' : 'en',
            format: 'text',
          }),
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            translatedText: data.translatedText || text,
          });
        }
        
        lastError = `${apiUrl} returned ${response.status}`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.log(`Failed to translate with ${apiUrl}:`, lastError);
        continue;
      }
    }

    console.error('All translation instances failed:', lastError);
    return NextResponse.json({
      translatedText: text,
      error: 'Translation unavailable',
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', translatedText: '' },
      { status: 500 }
    );
  }
}
