import { generateText } from 'ai';
import { config } from 'dotenv';

// Load the local secret file without ever printing its contents.
config({ path: '.env.local' });

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      'AI_GATEWAY_API_KEY is missing. Add it to .env.local on your own machine; do not paste it into chat or commit it.',
    );
  }

  const { text } = await generateText({
    model: 'moonshotai/kimi-k3',
    prompt:
      'Invent a joyful new holiday. Give it a memorable name, explain what it celebrates, and describe three distinctive traditions people follow to celebrate it.',
  });

  if (!text.trim()) {
    throw new Error('The model returned an empty response.');
  }

  // Print only the generated answer, never the API key or environment.
  console.log(text);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown generation error';
  console.error('AI Gateway example failed:', message);
  process.exitCode = 1;
});
