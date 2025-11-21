import { NextResponse } from 'next/server';

import { tokens as tokenThemes } from '@virtual-ds/tokens';

interface TokenRecord {
  id: string;
  path: string[];
  value: string;
  mode: string;
  type?: string;
}

function flattenTokens(theme: string, node: unknown, path: string[] = [], results: TokenRecord[] = []) {
  if (typeof node !== 'object' || node === null) {
    return results;
  }

  const entry = node as Record<string, any>;

  if ('value' in entry && typeof entry.value !== 'object') {
    results.push({
      id: path.join('-'),
      path,
      value: entry.value,
      mode: theme,
      type: entry.$type
    });
    return results;
  }

  for (const [key, child] of Object.entries(entry)) {
    if (key.startsWith('$')) continue;
    flattenTokens(theme, child, [...path, key], results);
  }

  return results;
}

const flattened = Object.entries(tokenThemes).flatMap(([theme, tokens]) => flattenTokens(theme, tokens));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const q = searchParams.get('q');

  let matches = flattened;

  if (mode) {
    matches = matches.filter((token) => token.mode === mode);
  }

  if (q) {
    const query = q.toLowerCase();
    matches = matches.filter((token) => [token.id, token.value].join(' ').toLowerCase().includes(query));
  }

  return NextResponse.json({ data: matches });
}
