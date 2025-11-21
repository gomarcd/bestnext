const STORYBOOK_URL = process.env.NEXT_PUBLIC_STORYBOOK_URL;

interface StorybookEmbedProps {
  storyId: string;
}

export function StorybookEmbed({ storyId }: StorybookEmbedProps) {
  if (!STORYBOOK_URL) {
    return (
      <div className="rounded-xl border border-ds-border bg-slate-50 p-6 text-sm text-slate-500">
        Set <code className="font-mono">NEXT_PUBLIC_STORYBOOK_URL</code> to embed live Storybook examples.
      </div>
    );
  }

  const src = `${STORYBOOK_URL}/iframe.html?id=${storyId}`;

  return (
    <div className="overflow-hidden rounded-xl border border-ds-border bg-white shadow-sm">
      <iframe
        src={src}
        title="Interactive example"
        className="h-[420px] w-full"
        loading="lazy"
        allow="clipboard-write"
      />
    </div>
  );
}
