"use client";

/**
 * The world's overlay. Deliberately small: the content inside is
 * <ProjectSections /> / site data, i.e. the same body the standard pages render
 * (AD-01), so a panel can never disagree with its page.
 *
 * Full dialog semantics (role, focus trap, focus return) are Task 6.1; this is
 * the Phase 2 scope, which is structure and shared content only.
 */
export function ProjectPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-start justify-center overflow-y-auto bg-facility-bg/70 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="my-auto max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-facility-border bg-facility-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-facility-muted">
            {`// ${title}`}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md border border-facility-border px-3 py-1.5 font-mono text-xs hover:border-accent hover:text-accent"
          >
            [ CLOSE ]
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
