const OPENROUTER_API_KEY = "API KEY";

export async function generatePropertiesFromQuery(query) {
  const prompt = `You are a real estate assistant. Given the following user request, respond with a JSON array of up to 3 matching properties. Each property should have: name, location, price, type, bedrooms, bathrooms, area, description, features (array), coordinates (lat,lng). User request: "${query}"`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
      }),
    }
  );

  const data = await response.json();
  try {
    const match = data.choices[0].message.content.match(/\[.*\]/s);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e) {
    return [];
  }
  return [];
}
