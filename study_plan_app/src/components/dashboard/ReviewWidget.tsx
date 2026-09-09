"use client";

export function ReviewWidget() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-panel-border bg-panel p-5">
      <h3 className="mb-3 text-[19px] font-semibold text-foreground font-serif">Due for Review</h3>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-8 text-center">
        <p className="text-[14px] leading-5 text-muted">
          No flashcards yet &ndash; generate some from a document.
        </p>
      </div>
    </div>
  );
}
