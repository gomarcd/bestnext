import lunr from 'lunr';
import { allComponentDocs, allGuideDocs } from 'contentlayer/generated';

interface SearchDocument {
  ref: string;
  title: string;
  description?: string;
  url: string;
  type: 'component' | 'guide';
  tags?: string[];
  status?: string;
  content: string;
}

const documents: SearchDocument[] = [
  ...allComponentDocs.map((doc) => ({
    ref: `component:${doc.id}`,
    title: doc.title,
    description: doc.summary,
    url: doc.url ?? `/components/${doc.slug}`,
    type: 'component' as const,
    tags: doc.tags,
    status: doc.status,
    content: [
      doc.summary,
      doc.tags?.join(' '),
      doc.props?.map((prop) => `${prop.name} ${prop.type} ${prop.description}`).join(' '),
      doc.tokens?.map((token) => `${token.name} ${token.alias} ${token.description}`).join(' '),
      doc.a11y?.aria?.join(' '),
      doc.a11y?.keyboard?.join(' '),
      doc.body.raw
    ]
      .filter(Boolean)
      .join(' ')
  })),
  ...allGuideDocs.map((doc) => ({
    ref: `guide:${doc.slug}`,
    title: doc.title,
    description: doc.description,
    url: doc.url ?? `/${doc.section.toLowerCase()}/${doc.slug}`,
    type: 'guide' as const,
    tags: doc.tags,
    content: [doc.description, doc.tags?.join(' '), doc.body.raw].filter(Boolean).join(' ')
  }))
];

const index = lunr(function () {
  this.ref('ref');
  this.field('title');
  this.field('description');
  this.field('content');
  this.field('tags');

  documents.forEach((doc) => {
    this.add(doc);
  });
});

export interface SearchMatch {
  title: string;
  url: string;
  description?: string;
  type: 'component' | 'guide';
  status?: string;
  tags?: string[];
  score: number;
}

export function searchDocs(query: string, limit = 10): SearchMatch[] {
  if (!query.trim()) return [];

  const results = index.search(query);
  return results.slice(0, limit).map((result) => {
    const doc = documents.find((item) => item.ref === result.ref);
    if (!doc) {
      return {
        title: result.ref,
        url: '#',
        type: 'guide',
        score: result.score
      } as SearchMatch;
    }
    return {
      title: doc.title,
      url: doc.url,
      description: doc.description,
      type: doc.type,
      status: doc.status,
      tags: doc.tags,
      score: result.score
    };
  });
}
