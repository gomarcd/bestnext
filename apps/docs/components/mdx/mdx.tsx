import Link from 'next/link';
import { useMDXComponent } from 'next-contentlayer/hooks';
import type { MDXComponents } from 'mdx/types';

import { CodeBlock } from './code-block';

const components: MDXComponents = {
  a: ({ href = '', ...props }) => {
    const isExternal = href.startsWith('http');
    if (isExternal) {
      return <a href={href} target="_blank" rel="noreferrer" {...props} />;
    }
    return <Link href={href} {...props} />;
  },
  pre: (props) => <CodeBlock {...props} />,
  table: (props) => (
    <div className="not-prose overflow-x-auto rounded-lg border border-ds-border">
      <table className="min-w-full divide-y divide-ds-border" {...props} />
    </div>
  )
};

interface MDXProps {
  code: string;
}

export function MDX({ code }: MDXProps) {
  const Component = useMDXComponent(code);
  return (
    <div className="prose prose-slate max-w-none">
      <Component components={components} />
    </div>
  );
}
