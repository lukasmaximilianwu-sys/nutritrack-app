import type { MealNutrition, Micros } from './types';
import { NUTRIENT_KEYS } from './nutrients';
import { getApiKey } from './storage';

const SYSTEM_PROMPT = `Du bist ein Ernährungs-Parser. Analysiere das eingegebene Essen und gib AUSSCHLIESSLICH ein valides JSON-Objekt zurück im Format:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "micros": {
    "vitamin_a_mcg": number,
    "vitamin_b1_mg": number,
    "vitamin_b2_mg": number,
    "vitamin_b3_mg": number,
    "vitamin_b5_mg": number,
    "vitamin_b6_mg": number,
    "vitamin_b7_mcg": number,
    "vitamin_b9_mcg": number,
    "vitamin_b12_mcg": number,
    "vitamin_c_mg": number,
    "vitamin_d_mcg": number,
    "vitamin_e_mg": number,
    "vitamin_k_mcg": number,
    "magnesium_mg": number,
    "zink_mg": number,
    "kalium_mg": number,
    "eisen_mg": number,
    "calcium_mg": number,
    "natrium_mg": number,
    "selen_mcg": number,
    "jod_mcg": number,
    "kupfer_mg": number,
    "polyphenole_mg": number,
    "flavonoide_mg": number,
    "lycopin_mg": number,
    "sulforaphan_mg": number,
    "carotinoide_mg": number,
    "omega3_g": number,
    "ballaststoffe_g": number
  }
}
Rechne die Werte auf Basis der Grammangaben hoch. Schätze alle Werte bestmöglich — bei Stoffen die im Essen kaum vorkommen, schreibe 0.`;

const VISION_PROMPT = `Du bist ein Ernährungs-Experte mit Computer-Vision-Fähigkeiten. Betrachte das Foto der Mahlzeit. Erkenne das Gericht, schätze die Portionsgrößen und berechne die Nährwerte. Gib AUSSCHLIESSLICH ein valides JSON-Objekt zurück im Format:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "micros": {
    "vitamin_a_mcg": number,
    "vitamin_b1_mg": number,
    "vitamin_b2_mg": number,
    "vitamin_b3_mg": number,
    "vitamin_b5_mg": number,
    "vitamin_b6_mg": number,
    "vitamin_b7_mcg": number,
    "vitamin_b9_mcg": number,
    "vitamin_b12_mcg": number,
    "vitamin_c_mg": number,
    "vitamin_d_mcg": number,
    "vitamin_e_mg": number,
    "vitamin_k_mcg": number,
    "magnesium_mg": number,
    "zink_mg": number,
    "kalium_mg": number,
    "eisen_mg": number,
    "calcium_mg": number,
    "natrium_mg": number,
    "selen_mcg": number,
    "jod_mcg": number,
    "kupfer_mg": number,
    "polyphenole_mg": number,
    "flavonoide_mg": number,
    "lycopin_mg": number,
    "sulforaphan_mg": number,
    "carotinoide_mg": number,
    "omega3_g": number,
    "ballaststoffe_g": number
  }
}
Beschreibe zuerst kurz was du auf dem Bild siehst (Gericht + Portionsgröße), dann gib das JSON zurück. Bei Stoffen die im Gericht kaum vorkommen, schreibe 0.`;

function validateAndComplete(parsed: MealNutrition): MealNutrition {
  if (typeof parsed.calories !== 'number' || typeof parsed.protein !== 'number' ||
      typeof parsed.carbs !== 'number' || typeof parsed.fat !== 'number' ||
      typeof parsed.micros !== 'object' || parsed.micros === null) {
    throw new Error('Unerwartetes JSON-Format von Groq.');
  }

  const completeMicros = { ...parsed.micros } as unknown as Record<string, unknown>;
  for (const key of NUTRIENT_KEYS) {
    if (typeof completeMicros[key] !== 'number') {
      completeMicros[key] = 0;
    }
  }

  return { ...parsed, micros: completeMicros as unknown as Micros };
}

function extractJson(content: string): MealNutrition {
  // Try to find JSON in the content (vision model may prepend text)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : content;

  let parsed: MealNutrition;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Konnte JSON aus Groq-Antwort nicht parsen.');
  }

  return validateAndComplete(parsed);
}

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const TEXT_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];
const VISION_MODELS = ['llama-3.2-11b-vision-instruct', 'llama-3.2-90b-vision-instruct-preview'];

async function groqChatCompletion(
  apiKey: string,
  models: string[],
  buildBody: (model: string) => Record<string, unknown>
): Promise<string> {
  let lastError = '';

  for (const model of models) {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildBody(model)),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
      throw new Error('Leere Antwort von Groq erhalten.');
    }

    const errorText = await response.text();
    lastError = `Groq API Fehler (${response.status}) mit Modell ${model}: ${errorText}`;

    // Only retry on 404 (model not found) or 503 (model loading); throw on other errors
    if (response.status !== 404 && response.status !== 503) {
      throw new Error(lastError);
    }
  }

  throw new Error(lastError || 'Alle Groq Modelle lieferten 404.');
}

export async function analyzeMeal(foodText: string): Promise<MealNutrition> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Bitte konfiguriere zuerst deinen Groq API-Key in den Einstellungen.');
  }

  const content = await groqChatCompletion(apiKey, TEXT_MODELS, (model) => ({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Analysiere folgende Mahlzeit: ${foodText}` },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  }));

  return extractJson(content);
}

export async function analyzePhoto(base64Image: string): Promise<MealNutrition & { description: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Bitte konfiguriere zuerst deinen Groq API-Key in den Einstellungen.');
  }

  const imageData = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;

  const content = await groqChatCompletion(apiKey, VISION_MODELS, (model) => ({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_PROMPT },
          { type: 'image_url', image_url: { url: imageData } },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 2048,
  }));

  // Extract description (text before the JSON block)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const description = jsonMatch ? content.slice(0, jsonMatch.index).trim() : content;
  const result = extractJson(content);

  return { ...result, description: description || 'Foto analysiert' };
}
