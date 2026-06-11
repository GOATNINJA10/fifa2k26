export default function Footer() {
  return (
    <footer className="w-full py-6 px-8 flex justify-between items-center border-t border-outline-variant bg-surface-container-low/80 backdrop-blur-sm shrink-0 flex-wrap gap-4">
      <span className="font-label-md text-label-md text-on-surface font-bold">
        © Fifa World Cup 2026 Simulator
      </span>
      <div className="flex gap-6">
        <a href="#" className="text-on-surface-variant hover:text-secondary hover:underline transition-colors font-label-md text-label-md">
          Save Progress
        </a>
        <a href="#" className="text-on-surface-variant hover:text-secondary hover:underline transition-colors font-label-md text-label-md">
          Load Progress
        </a>
        <a href="#" className="text-on-surface-variant hover:text-secondary hover:underline transition-colors font-label-md text-label-md">
          Export Data
        </a>
      </div>
    </footer>
  );
}
