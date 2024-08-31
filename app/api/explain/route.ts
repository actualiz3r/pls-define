import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use server-side environment variable
});

// Rate limiting variables
const RATE_LIMIT_WINDOW = 1000; // 15 seconds in milliseconds
let lastRequestTime = 0;

export async function POST(request: Request) {
  const { text, isUserAction } = await request.json();

  // Apply rate limiting only for user actions
  if (isUserAction) {
    const now = Date.now();
    if (now - lastRequestTime < RATE_LIMIT_WINDOW) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }
    lastRequestTime = now;
  }

  for (let attempt = 0; attempt < Number(process.env.MAX_RETRIES); attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant that identifies and explains potentially misunderstood terms in a given text to a technical audience. Always respond with valid JSON." },
          { role: "user", content: `Analyze the following text and identify any terms or concepts that might be misunderstood or require further explanation. For each term, provide a brief, clear definition. Respond with a valid JSON array of objects, each with 'term' and 'definition' keys. Ensure the JSON is properly formatted and escaped.\n\nText to analyze: "${text}"` },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = completion.choices[0].message.content;
      if (content) {
        // Remove any non-JSON content and parse
        const jsonContent = content.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, '$1');
        const parsedContent = JSON.parse(jsonContent);
        return NextResponse.json(parsedContent);
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === Number(process.env.MAX_RETRIES) - 1) {
        return NextResponse.json({ error: "Max retries reached. An error occurred while processing the request" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ error: "No valid content in API response after retries" }, { status: 500 });
}