import { DashboardPage } from "@/components/dashboard/DashboardPage";

export default function Home() {
  return <DashboardPage />;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] =
    useState<string[]>(DEFAULT_WIDGET_IDS);
  const { theme, toggleTheme } = useTheme();
  const toggleWidget = (id: string) => {
    setActiveWidgetIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const activeWidgets = WIDGET_REGISTRY.filter((w) =>
    activeWidgetIds.includes(w.id)
  );
  return (
    <div className="flex h-full min-h-screen w-full bg-background font-sans">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-1.5 text-muted hover:bg-[var(--overlay)] md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <p className="text-[12.5px] capitalize text-muted">{today}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose/10 px-3 py-1 text-[12px] font-medium text-rose">
              <Flame size={13} />0 Day Streak
            </span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>
        <main className="flex-1 px-4 pb-10 pt-2 sm:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[26px] font-medium tracking-tight text-foreground font-serif sm:text-[30px]">
              Good evening, <span className="text-[var(--accent-strong)]">Manar</span>.
            </h1>
            <WidgetPicker activeIds={activeWidgetIds} onToggle={toggleWidget} />
          </div>
          <FocusCard />
          {activeWidgets.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {activeWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className={widget.span === "full" ? "col-span-full" : ""}
                >
                  {widget.render()}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-panel-border bg-[var(--sunken)] px-4 py-12 text-center">
              <p className="text-[13.5px] text-muted">
                Your dashboard is empty &ndash; use Customize to add what
                matters to you.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}