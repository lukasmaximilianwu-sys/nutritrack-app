import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `Du bist ein Ernährungs-Parser. Analysiere das eingegebene Essen und gib AUSSCHLIESSLICH ein valides JSON-Objekt zurück im Format:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "micros": {
    "magnesium_mg": number,
    "zink_mg": number,
    "kalium_mg": number,
    "vitamin_c_mg": number,
    "vitamin_b12_mcg": number,
    "eisen_mg": number
  }
}`;

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

interface ParsedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micros: {
    magnesium_mg: number;
    zink_mg: number;
    kalium_mg: number;
    vitamin_c_mg: number;
    vitamin_b12_mcg: number;
    eisen_mg: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { foodText, apiKey } = await req.json();

    if (!foodText || typeof foodText !== "string" || foodText.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Kein Essenstext angegeben." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!apiKey || typeof apiKey !== "string") {
      return new Response(JSON.stringify({ error: "Kein Groq API-Key konfiguriert. Bitte in den Einstellungen hinterlegen." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analysiere folgende Mahlzeit und rechne die Werte auf Basis der Grammangaben hoch: ${foodText}` },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return new Response(JSON.stringify({ error: `Groq API Fehler (${groqResponse.status}): ${errorText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData: GroqResponse = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "Leere Antwort von Groq erhalten." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: ParsedNutrition;
    try {
      parsed = JSON.parse(content) as ParsedNutrition;
    } catch {
      return new Response(JSON.stringify({ error: "Konnte JSON aus Groq-Antwort nicht parsen." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the shape
    if (typeof parsed.calories !== "number" || typeof parsed.protein !== "number" ||
        typeof parsed.carbs !== "number" || typeof parsed.fat !== "number" ||
        typeof parsed.micros !== "object" || parsed.micros === null) {
      return new Response(JSON.stringify({ error: "Unerwartetes JSON-Format von Groq." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unbekannter Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
