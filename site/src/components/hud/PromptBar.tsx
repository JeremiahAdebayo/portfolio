export function PromptBar({ prompt }: { prompt: string }) {
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded border border-accent bg-facility-bg/90 px-4 py-2 text-sm text-accent">
      [E] {prompt}
    </div>
  );
}
