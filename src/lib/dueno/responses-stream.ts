export class GatewayError extends Error {
  constructor(public status: number, message: string, public denial = false) { super(message); }
}

export async function consumeResponseStream(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', text = '', completed = false;
  const frame = (raw: string) => {
    const data = raw.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
    if (!data || data === '[DONE]') return;
    const e = JSON.parse(data);
    if (e.type === 'response.output_text.delta') text += e.delta ?? '';
    if (e.type === 'response.refusal.delta' || e.type === 'response.refusal.done') throw new GatewayError(422, 'The AI declined this request. Nothing was sent.');
    if (e.type === 'error' || e.type === 'response.failed') throw new GatewayError(e.error?.status ?? e.response?.error?.status ?? 502, e.error?.message ?? e.response?.error?.message ?? e.message ?? 'AI generation failed.', e.error?.type === 'permission_error');
    if (e.type === 'response.incomplete') throw new GatewayError(502, 'The AI response was interrupted. Nothing was sent.');
    if (e.type === 'response.completed') completed = true;
  };
  try {
    for (;;) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done }).replace(/\r\n/g, '\n');
      let end = buffer.indexOf('\n\n');
      while (end >= 0) { frame(buffer.slice(0, end)); buffer = buffer.slice(end + 2); end = buffer.indexOf('\n\n'); }
      if (chunk.done) break;
    }
    if (buffer.trim()) frame(buffer);
    if (!completed || !text.trim()) throw new GatewayError(502, 'The AI did not complete an answer. Nothing was sent.');
    return text.trim();
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}