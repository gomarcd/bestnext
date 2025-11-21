import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const docsRoot = path.join(repoRoot, 'apps/docs');
const cmsPath = path.join(repoRoot, 'data', 'cms.json');
const contentRoot = path.join(docsRoot, '.contentlayer/generated');

const requireFromDocs = createRequire(path.join(docsRoot, 'package.json'));
const React = requireFromDocs('react');
const { renderToStaticMarkup } = requireFromDocs('react-dom/server');
const { getMDXComponent } = requireFromDocs('next-contentlayer/hooks');

const mdxComponents = {
  a: (props) => React.createElement('a', props),
  pre: (props) => React.createElement('pre', props),
  table: (props) => React.createElement('table', props)
};

const readMdxDocs = async (dir) => {
  const entries = await fs.readdir(dir).catch(() => []);
  return Promise.all(
    entries
      .filter((file) => file.endsWith('.mdx.json') && !file.startsWith('_'))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(dir, file), 'utf8');
        return JSON.parse(raw);
      })
  );
};

const renderDocHtml = (doc) => {
  try {
    const Component = getMDXComponent(doc.body.code);
    const element = React.createElement(Component, { components: mdxComponents });
    return renderToStaticMarkup(element);
  } catch (error) {
    console.warn(`Failed to render MDX for ${doc.title ?? doc.slug}`, error);
    return doc.body.raw ?? '';
  }
};

const createSection = (html) => ({
  id: `section-${randomUUID()}`,
  columns: [
    {
      id: `column-${randomUUID()}`,
      span: 12,
      blocks: [
        {
          id: `block-${randomUUID()}`,
          kind: 'rich-text',
          html
        }
      ]
    }
  ]
});

const normalizePath = (value) => {
  if (!value) return null;
  return value.startsWith('/') ? value : `/${value}`;
};

const main = async () => {
  const rawCms = await fs.readFile(cmsPath, 'utf8');
  const cms = JSON.parse(rawCms);

  const guideDocs = await readMdxDocs(path.join(contentRoot, 'GuideDoc'));
  const componentDocs = await readMdxDocs(path.join(contentRoot, 'ComponentDoc'));

  const htmlByPath = new Map();
  guideDocs.forEach((doc) => {
    const docPath = normalizePath(doc.url ?? `/${doc.section.toLowerCase()}/${doc.slug}`);
    if (docPath) {
      htmlByPath.set(docPath, renderDocHtml(doc));
    }
  });

  componentDocs.forEach((doc) => {
    const docPath = normalizePath(doc.url ?? `/components/${doc.slug}`);
    if (docPath) {
      htmlByPath.set(docPath, renderDocHtml(doc));
    }
  });

  let updated = 0;

  const pages = cms.pages.map((page) => {
    if (page.path.startsWith('/admin')) {
      return page;
    }
    const html = htmlByPath.get(page.path);
    if (!html) {
      return page;
    }
    updated += 1;
    return {
      ...page,
      body: html,
      sections: [createSection(html)],
      updatedAt: new Date().toISOString()
    };
  });

  const output = { ...cms, pages };
  await fs.writeFile(cmsPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Seeded ${updated} CMS pages from MDX content.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
