import { defineDocumentType, defineNestedType, makeSource } from 'contentlayer/source-files';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';

const computedSlug = (doc: { _raw: { flattenedPath: string } }) =>
  doc._raw.flattenedPath.replace(/^(components|foundations|patterns|accessibility|developers|changelog)\//, '');

const ComponentProp = defineNestedType(() => ({
  name: 'ComponentProp',
  fields: {
    name: { type: 'string', required: true },
    type: { type: 'string', required: true },
    default: { type: 'string', required: false },
    description: { type: 'string', required: false },
    required: { type: 'boolean', default: false }
  }
}));

const ComponentEvent = defineNestedType(() => ({
  name: 'ComponentEvent',
  fields: {
    name: { type: 'string', required: true },
    type: { type: 'string', required: true },
    description: { type: 'string', required: false }
  }
}));

const ComponentSlot = defineNestedType(() => ({
  name: 'ComponentSlot',
  fields: {
    name: { type: 'string', required: true },
    description: { type: 'string', required: true }
  }
}));

const ComponentToken = defineNestedType(() => ({
  name: 'ComponentToken',
  fields: {
    name: { type: 'string', required: true },
    alias: { type: 'string', required: false },
    description: { type: 'string', required: false }
  }
}));

const ComponentCode = defineNestedType(() => ({
  name: 'ComponentCode',
  fields: {
    html: { type: 'string', required: false },
    ts: { type: 'string', required: false },
    twig: { type: 'string', required: false },
    css: { type: 'string', required: false }
  }
}));

const ComponentA11y = defineNestedType(() => ({
  name: 'ComponentA11y',
  fields: {
    aria: { type: 'list', of: { type: 'string' }, required: false },
    keyboard: { type: 'list', of: { type: 'string' }, required: false },
    notes: { type: 'list', of: { type: 'string' }, required: false }
  }
}));

const GuideDoc = defineDocumentType(() => ({
  name: 'GuideDoc',
  filePathPattern: '{foundations,patterns,accessibility,developers,changelog}/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: false },
    section: {
      type: 'enum',
      options: ['Foundations', 'Patterns', 'Accessibility', 'Developers', 'Changelog'],
      required: true
    },
    order: { type: 'number', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false }
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => computedSlug(doc) },
    url: { type: 'string', resolve: (doc) => `/${doc.section.toLowerCase()}/${computedSlug(doc)}` }
  }
}));

const ComponentDoc = defineDocumentType(() => ({
  name: 'ComponentDoc',
  filePathPattern: 'components/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    id: { type: 'string', required: true },
    status: {
      type: 'enum',
      options: ['alpha', 'beta', 'stable'],
      default: 'beta'
    },
    summary: { type: 'string', required: true },
    since: { type: 'string', required: true },
    figma: { type: 'string', required: false },
    preview: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    componentName: { type: 'string', required: true },
    order: { type: 'number', required: false },
    props: { type: 'json', required: false },
    events: { type: 'json', required: false },
    slots: { type: 'json', required: false },
    tokens: { type: 'json', required: false },
    dependencies: { type: 'list', of: { type: 'string' }, required: false },
    code: { type: 'json', required: false },
    a11y: { type: 'json', required: false },
    related: { type: 'list', of: { type: 'string' }, required: false }
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => computedSlug(doc) },
    url: { type: 'string', resolve: (doc) => `/components/${computedSlug(doc)}` }
  }
}));


export default makeSource({
  contentDirPath: 'content',
  documentTypes: [GuideDoc, ComponentDoc],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: {
            light: 'github-light',
            dark: 'github-dark'
          },
          onVisitLine(node: any) {
            if (node.children.length === 0) {
              node.children = [{ type: 'text', value: ' ' }];
            }
          }
        }
      ]
    ]
  }
});
