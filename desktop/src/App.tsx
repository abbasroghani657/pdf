/**
 * TinyLovePDF — all-in-one PDF toolkit desktop app (single-file build).
 * Dependencies: react, lucide-react, motion, canvas-confetti
 *   npm i lucide-react motion canvas-confetti
 * Tailwind CSS is assumed to be set up. Drop this file in and render <App />.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  LayoutGrid, Repeat, FolderCog, Gauge, PencilRuler, ShieldCheck, Sparkles,
  Clock, Settings as SettingsIcon, ChevronsLeft, Crown, FileHeart,
  Search, Wifi, WifiOff, Moon, Sun, UploadCloud, FolderOpen, SearchX,
  ArrowLeft, FileText, GripVertical, Plus, X, CheckCircle2, Download,
  RotateCcw, Loader2, Send, User, RotateCw, Trash2, ArrowUpDown, FilePlus2,
  FileOutput, Minimize2, Wrench, ScanText, Highlighter, Droplets, Hash,
  PanelTop, Layers2, FormInput, Lock, LockOpen, EyeOff, PenTool, BadgeCheck,
  MessagesSquare, FileSearch, AlignLeft, Languages, Database, MoreHorizontal,
  FileType2, FileSpreadsheet, Table2, FileImage, Image as ImageIcon,
  Presentation, MonitorPlay, Code2, Globe, Type, Layers, Scissors, Bell,
  HardDrive, type LucideIcon,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   DATA
──────────────────────────────────────────────────────────────────────── */
type Category = "Convert" | "Organize" | "Optimize" | "Edit & Enhance" | "Security" | "AI Tools";
type Badge = "Popular" | "New" | "Free" | "AI + New";

interface Tool {
  id: string; name: string; description: string; category: Category;
  icon: LucideIcon; badge?: Badge; online?: boolean;
}

const CATEGORY_META: Record<Category, { accent: string; tint: string; tintDark: string }> = {
  Convert: { accent: "#3b82f6", tint: "#e0ecff", tintDark: "#15233f" },
  Organize: { accent: "#06b6d4", tint: "#cffafe", tintDark: "#0e2f38" },
  Optimize: { accent: "#14b8a6", tint: "#ccfbf1", tintDark: "#0d3330" },
  "Edit & Enhance": { accent: "#f59e0b", tint: "#fef3c7", tintDark: "#3a2c0c" },
  Security: { accent: "#10b981", tint: "#d1fae5", tintDark: "#0d3326" },
  "AI Tools": { accent: "#8b5cf6", tint: "#ede9fe", tintDark: "#241a40" },
};

const CATEGORY_ORDER: Category[] = ["Convert", "Organize", "Optimize", "Edit & Enhance", "Security", "AI Tools"];

const TOOLS: Tool[] = [
  // Convert (11)
  { id: "pdf-to-word", name: "PDF to Word", description: "Convert PDFs into editable DOC and DOCX documents.", category: "Convert", icon: FileText, badge: "Popular" },
  { id: "word-to-pdf", name: "Word to PDF", description: "Turn DOC and DOCX files into polished PDFs.", category: "Convert", icon: FileType2, badge: "Popular" },
  { id: "pdf-to-excel", name: "PDF to Excel", description: "Extract tables and data straight into spreadsheets.", category: "Convert", icon: FileSpreadsheet, badge: "Free" },
  { id: "excel-to-pdf", name: "Excel to PDF", description: "Make EXCEL spreadsheets easy to read as PDF.", category: "Convert", icon: Table2, badge: "Free" },
  { id: "pdf-to-jpg", name: "PDF to JPG", description: "Convert each page to JPG or extract all images.", category: "Convert", icon: FileImage, badge: "Free" },
  { id: "jpg-to-pdf", name: "JPG to PDF", description: "Combine JPG images into a single PDF in seconds.", category: "Convert", icon: ImageIcon, badge: "Free" },
  { id: "pdf-to-ppt", name: "PDF to PowerPoint", description: "Turn PDFs into editable PPT and PPTX slideshows.", category: "Convert", icon: Presentation, badge: "Free" },
  { id: "ppt-to-pdf", name: "PowerPoint to PDF", description: "Make PPT slideshows easy to view as PDF.", category: "Convert", icon: MonitorPlay, badge: "Free" },
  { id: "pdf-to-html", name: "PDF to HTML", description: "Convert PDF documents to clean HTML web pages.", category: "Convert", icon: Code2, badge: "New", online: true },
  { id: "html-to-pdf", name: "HTML to PDF", description: "Convert webpages and HTML directly into PDF.", category: "Convert", icon: Globe, badge: "New", online: true },
  { id: "pdf-to-text", name: "PDF to Text", description: "Extract text from your PDF into editable TXT.", category: "Convert", icon: Type, badge: "Free" },
  // Organize (7)
  { id: "merge", name: "Merge PDF", description: "Combine PDFs in the order you want with ease.", category: "Organize", icon: Layers, badge: "Popular" },
  { id: "split", name: "Split PDF", description: "Separate one page or whole sets into new files.", category: "Organize", icon: Scissors, badge: "Popular" },
  { id: "rotate", name: "Rotate PDF", description: "Rotate your pages exactly the way you need.", category: "Organize", icon: RotateCw, badge: "Free" },
  { id: "delete-pages", name: "Delete Pages", description: "Remove unwanted pages from a PDF in a flash.", category: "Organize", icon: Trash2, badge: "Free" },
  { id: "reorder", name: "Reorder Pages", description: "Drag and drop to change the page order.", category: "Organize", icon: ArrowUpDown, badge: "Free" },
  { id: "add-blank", name: "Add Blank Page", description: "Insert a blank page anywhere in the document.", category: "Organize", icon: FilePlus2, badge: "Free" },
  { id: "extract-pages", name: "Extract Pages", description: "Pull specific pages out into a new PDF.", category: "Organize", icon: FileOutput, badge: "Free" },
  // Optimize (3)
  { id: "compress", name: "Compress PDF", description: "Reduce file size while keeping quality high.", category: "Optimize", icon: Minimize2, badge: "Popular" },
  { id: "repair", name: "Repair PDF", description: "Recover data from corrupt or damaged PDFs.", category: "Optimize", icon: Wrench, badge: "Free" },
  { id: "ocr", name: "OCR PDF", description: "Make scanned PDFs selectable and searchable.", category: "Optimize", icon: ScanText, badge: "New", online: true },
  // Edit & Enhance (7)
  { id: "edit", name: "Edit PDF", description: "Add text, images and shapes to your PDF.", category: "Edit & Enhance", icon: PencilRuler, badge: "Free" },
  { id: "annotate", name: "Annotate PDF", description: "Highlight, underline and comment on pages.", category: "Edit & Enhance", icon: Highlighter, badge: "Free" },
  { id: "watermark", name: "Watermark PDF", description: "Stamp an image or text over your PDF.", category: "Edit & Enhance", icon: Droplets, badge: "Free" },
  { id: "page-numbers", name: "Add Page Numbers", description: "Insert page numbers with full position control.", category: "Edit & Enhance", icon: Hash, badge: "Free" },
  { id: "header-footer", name: "Header & Footer", description: "Add consistent headers and footers to pages.", category: "Edit & Enhance", icon: PanelTop, badge: "Free" },
  { id: "flatten", name: "Flatten PDF", description: "Merge all layers and forms into one flat layer.", category: "Edit & Enhance", icon: Layers2, badge: "Free" },
  { id: "forms", name: "PDF Forms", description: "Fill and create fillable PDF forms quickly.", category: "Edit & Enhance", icon: FormInput, badge: "Free" },
  // Security (6)
  { id: "protect", name: "Protect PDF", description: "Encrypt your PDF with a password to keep it safe.", category: "Security", icon: Lock, badge: "Free" },
  { id: "unlock", name: "Unlock PDF", description: "Remove password protection from your PDF.", category: "Security", icon: LockOpen, badge: "Free" },
  { id: "redact", name: "Redact PDF", description: "Permanently black out sensitive information.", category: "Security", icon: EyeOff, badge: "New" },
  { id: "sign", name: "Sign PDF", description: "Add your electronic signature to documents.", category: "Security", icon: PenTool, badge: "Popular" },
  { id: "request-signature", name: "Request Signature", description: "Send documents to others to sign legally.", category: "Security", icon: Send, badge: "Free", online: true },
  { id: "certificate-sign", name: "Certificate Sign", description: "Sign with a cryptographic digital certificate.", category: "Security", icon: BadgeCheck, badge: "Free", online: true },
  // AI Tools (5)
  { id: "chat", name: "Chat with PDF", description: "Ask questions and get instant answers from any PDF.", category: "AI Tools", icon: MessagesSquare, badge: "AI + New", online: true },
  { id: "summarize", name: "Summarize PDF", description: "Generate a concise summary of long documents.", category: "AI Tools", icon: AlignLeft, badge: "AI + New", online: true },
  { id: "translate", name: "Translate PDF", description: "Translate full documents while keeping layout.", category: "AI Tools", icon: Languages, badge: "AI + New", online: true },
  { id: "extract-data", name: "Extract Data", description: "Intelligently extract tables, values and entities.", category: "AI Tools", icon: Database, badge: "AI + New", online: true },
  { id: "plagiarism", name: "Plagiarism Check", description: "Compare your document against billions of pages.", category: "AI Tools", icon: FileSearch, badge: "AI + New", online: true },
];
const TOTAL_TOOLS = TOOLS.length;

type View =
  | { kind: "category"; category: Category | "All Tools" }
  | { kind: "recent" }
  | { kind: "settings" }
  | { kind: "tool"; toolId: string };

/* ────────────────────────────────────────────────────────────────────────
   PRIMITIVES (native, dependency-free)
──────────────────────────────────────────────────────────────────────── */
function Button({
  children, className = "", variant = "solid", style, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    solid: "bg-blue-600 text-white shadow-sm hover:brightness-110",
    outline: "border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5",
    ghost: "hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} style={style} {...rest}>
      {children}
    </button>
  );
}

function Switch({ checked, onChange, disabled }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function BadgePill({ badge }: { badge: Badge }) {
  const styles: Record<Badge, string> = {
    Popular: "bg-rose-500/12 text-rose-500 dark:text-rose-300",
    New: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
    Free: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
    "AI + New": "bg-violet-500/12 text-violet-600 dark:text-violet-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none ${styles[badge]}`}>
      {badge === "AI + New" && <Sparkles className="size-3" />}
      {badge}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   SIDEBAR
──────────────────────────────────────────────────────────────────────── */
const NAV: { label: Category | "All Tools"; icon: LucideIcon }[] = [
  { label: "All Tools", icon: LayoutGrid },
  { label: "Convert", icon: Repeat },
  { label: "Organize", icon: FolderCog },
  { label: "Optimize", icon: Gauge },
  { label: "Edit & Enhance", icon: PencilRuler },
  { label: "Security", icon: ShieldCheck },
  { label: "AI Tools", icon: Sparkles },
];

function Sidebar({
  view, onNavigate, collapsed, onToggleCollapse,
}: { view: View; onNavigate: (v: View) => void; collapsed: boolean; onToggleCollapse: () => void }) {
  const activeCategory = view.kind === "category" ? view.category : null;
  const itemCls = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      active
        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
        : "text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
    }`;

  return (
    <aside className={`flex h-full flex-col border-r border-black/5 dark:border-white/10 bg-white dark:bg-[#0d1320] transition-[width] duration-200 ${collapsed ? "w-[72px]" : "w-[248px]"}`}>
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="shrink-0 flex items-center justify-center">
          <img src="/logo.svg" className="size-8" alt="TheyLovePDF" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">TheyLovePDF</span>
            <span className="rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">Free</span>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
        {NAV.map(({ label, icon: Icon }) => {
          const active = activeCategory === label;
          const accent = label !== "All Tools" ? CATEGORY_META[label].accent : "#3b82f6";
          return (
            <button key={label} onClick={() => onNavigate({ kind: "category", category: label })} title={collapsed ? label : undefined} className={itemCls(active)}>
              <Icon className="size-[18px] shrink-0" style={active ? { color: accent } : undefined} />
              {!collapsed && <span className="truncate font-medium">{label}</span>}
            </button>
          );
        })}

        <div className="my-3 border-t border-black/5 dark:border-white/10" />
        {!collapsed && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account</p>}
        <button onClick={() => onNavigate({ kind: "recent" })} title={collapsed ? "Recent Files" : undefined} className={itemCls(view.kind === "recent")}>
          <Clock className="size-[18px] shrink-0" />{!collapsed && <span className="font-medium">Recent Files</span>}
        </button>
        <button onClick={() => onNavigate({ kind: "settings" })} title={collapsed ? "Settings" : undefined} className={itemCls(view.kind === "settings")}>
          <SettingsIcon className="size-[18px] shrink-0" />{!collapsed && <span className="font-medium">Settings</span>}
        </button>
      </nav>

      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-600 p-4 text-white shadow-lg shadow-blue-600/20">
            <div className="absolute -right-6 -top-6 size-20 rounded-full bg-white/10 blur-xl" />
            <Crown className="size-5" />
            <p className="mt-2 font-semibold">Upgrade to Pro</p>
            <p className="mt-0.5 text-[12px] leading-snug text-white/80">Unlock AI tools, batch processing and no file limits.</p>
            <Button className="mt-3 w-full bg-white text-indigo-700 hover:bg-white/90">Upgrade</Button>
          </div>
        </div>
      )}

      <div className="border-t border-black/5 dark:border-white/10 p-3">
        <button onClick={onToggleCollapse} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
          <ChevronsLeft className={`size-[18px] transition-transform ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   TOP BAR
──────────────────────────────────────────────────────────────────────── */
function TopBar({
  query, onQuery, online, onToggleOnline, dark, onToggleDark,
}: { query: string; onQuery: (q: string) => void; online: boolean; onToggleOnline: () => void; dark: boolean; onToggleDark: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-black/5 dark:border-white/10 bg-white/60 dark:bg-[#111726]/60 px-5 backdrop-blur">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query} onChange={(e) => onQuery(e.target.value)} placeholder={`Search ${TOTAL_TOOLS} tools…`}
          className="h-10 w-full rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-[#161d2e] pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button onClick={onToggleOnline} title="Toggle connection mode"
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}>
          <span className="relative flex size-2">
            <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${online ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className={`relative inline-flex size-2 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`} />
          </span>
          {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {online ? "Online" : "Offline"}
        </button>

        <button onClick={onToggleDark} title="Toggle theme"
          className="grid size-10 place-items-center rounded-xl border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
          {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">AK</button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111726] py-1 shadow-xl">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">Ayesha Khan</p>
                  <p className="text-xs text-slate-500">ayesha@tinylove.app</p>
                </div>
                <div className="my-1 border-t border-black/5 dark:border-white/10" />
                {["Account", "Billing", "Help & Support"].map((i) => (
                  <button key={i} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5">{i}</button>
                ))}
                <div className="my-1 border-t border-black/5 dark:border-white/10" />
                <button className="block w-full px-3 py-1.5 text-left text-sm text-rose-500 hover:bg-black/5 dark:hover:bg-white/5">Sign out</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   DROP ZONE
──────────────────────────────────────────────────────────────────────── */
function DropZone({ onFiles }: { onFiles?: (count: number) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles?.(e.dataTransfer.files.length || 1); }}
      className={`group flex items-center gap-4 rounded-2xl border-2 border-dashed px-5 py-4 transition-all ${
        over ? "border-blue-500 bg-blue-500/5 scale-[1.005]" : "border-black/10 dark:border-white/15 bg-white dark:bg-[#111726] hover:border-blue-500/40"
      }`}
    >
      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><UploadCloud className="size-6" /></div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">Drop PDF files here</p>
        <p className="text-sm text-slate-500">or click browse to select files · PDF, DOCX, JPG, PNG</p>
      </div>
      <Button onClick={() => onFiles?.(1)}><FolderOpen className="size-4" />Browse files</Button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   TOOL CARD + GRID
──────────────────────────────────────────────────────────────────────── */
function ToolCard({ tool, dark, onOpen }: { tool: Tool; dark: boolean; onOpen: (t: Tool) => void }) {
  const meta = CATEGORY_META[tool.category];
  const Icon = tool.icon;
  return (
    <motion.button
      layout whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={() => onOpen(tool)} style={{ ["--accent" as string]: meta.accent }}
      className="group relative flex h-full flex-col rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#111726] p-4 text-left shadow-sm transition-colors hover:border-[var(--accent)] hover:shadow-[0_8px_30px_-10px_var(--accent)]"
    >
      <div className="flex items-start justify-between">
        <div className="grid size-11 place-items-center rounded-xl transition-transform group-hover:scale-105"
          style={{ backgroundColor: dark ? meta.tintDark : meta.tint, color: meta.accent }}>
          <Icon className="size-[22px]" />
        </div>
        {tool.badge && <BadgePill badge={tool.badge} />}
      </div>
      <p className="mt-3 font-semibold tracking-tight">{tool.name}</p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{tool.description}</p>
      <div className="mt-3 flex items-center gap-1.5 pt-1 text-[11px] font-medium">
        {tool.online ? (
          <span className="inline-flex items-center gap-1 text-blue-500"><Wifi className="size-3" /> Online only</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-emerald-500"><WifiOff className="size-3" /> Works offline</span>
        )}
      </div>
    </motion.button>
  );
}

function ToolGrid({ filter, query, dark, onOpen }: { filter: Category | "All Tools"; query: string; dark: boolean; onOpen: (t: Tool) => void }) {
  const q = query.trim().toLowerCase();
  const grouped = useMemo(() => {
    const cats = filter === "All Tools" ? CATEGORY_ORDER : [filter as Category];
    return cats.map((cat) => ({
      cat,
      tools: TOOLS.filter((t) => t.category === cat && (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))),
    })).filter((g) => g.tools.length > 0);
  }, [filter, q]);

  if (grouped.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 dark:border-white/15 py-20 text-center">
        <SearchX className="size-10 text-slate-300" />
        <p className="mt-3 font-medium">No tools found</p>
        <p className="text-sm text-slate-500">Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-9">
      {grouped.map(({ cat, tools }) => (
        <section key={cat}>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_META[cat].accent }} />
            <h2 className="text-lg font-semibold tracking-tight">{cat}</h2>
            <span className="rounded-full bg-slate-100 dark:bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-500">{tools.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((t) => <ToolCard key={t.id} tool={t} dark={dark} onOpen={onOpen} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   TOOL WORKSPACE (config → processing → success)
──────────────────────────────────────────────────────────────────────── */
interface FileItem { id: string; name: string; size: string; pages: number; }
const SEED_FILES: FileItem[] = [
  { id: "f1", name: "Q2-Financial-Report.pdf", size: "2.4 MB", pages: 18 },
  { id: "f2", name: "Marketing-Deck-2026.pdf", size: "5.1 MB", pages: 32 },
  { id: "f3", name: "Invoice-04821.pdf", size: "184 KB", pages: 2 },
];

function ToolWorkspace({ tool, dark, onBack }: { tool: Tool; dark: boolean; onBack: () => void }) {
  const meta = CATEGORY_META[tool.category];
  const Icon = tool.icon;
  const [files, setFiles] = useState<FileItem[]>(SEED_FILES);
  const [stage, setStage] = useState<"config" | "processing" | "success">("config");
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState(72);
  const dragId = useRef<string | null>(null);

  const reorder = (overId: string) => {
    const from = dragId.current;
    if (!from || from === overId) return;
    setFiles((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(arr.findIndex((f) => f.id === from), 1);
      arr.splice(arr.findIndex((f) => f.id === overId), 0, moved);
      return arr;
    });
  };

  useEffect(() => {
    if (stage !== "processing") return;
    const t = setInterval(() => setProgress((p) => (p >= 100 ? (clearInterval(t), 100) : Math.min(100, p + Math.random() * 16 + 4))), 240);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => {
    if (stage === "processing" && progress >= 100) {
      const t = setTimeout(() => {
        setStage("success");
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: [meta.accent, "#ffffff", "#3b82f6"] });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [stage, progress, meta.accent]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/10 px-6 py-4">
        <button onClick={onBack} className="grid size-9 place-items-center rounded-lg border border-black/10 dark:border-white/10 text-slate-500 transition-colors hover:bg-black/5 dark:hover:bg-white/5"><ArrowLeft className="size-[18px]" /></button>
        <div className="grid size-10 place-items-center rounded-xl" style={{ backgroundColor: dark ? meta.tintDark : meta.tint, color: meta.accent }}><Icon className="size-5" /></div>
        <div>
          <h1 className="text-lg font-semibold leading-tight tracking-tight">{tool.name}</h1>
          <p className="text-sm text-slate-500">{tool.description}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {stage === "config" && (
          <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid flex-1 grid-cols-1 gap-px overflow-hidden bg-black/5 dark:bg-white/10 lg:grid-cols-[1fr_300px]">
            <div className="flex flex-col gap-5 overflow-y-auto bg-slate-50 dark:bg-[#0a0e1a] p-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold tracking-tight">Files</h3>
                  <Button variant="outline"><Plus className="size-4" /> Add file</Button>
                </div>
                <div className="flex flex-col gap-2">
                  {files.map((f) => (
                    <div key={f.id} draggable onDragStart={() => (dragId.current = f.id)}
                      onDragOver={(e) => { e.preventDefault(); reorder(f.id); }} onDragEnd={() => (dragId.current = null)}
                      className="flex items-center gap-3 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#111726] p-3 transition-shadow hover:shadow-sm">
                      <GripVertical className="size-4 cursor-grab text-slate-400 active:cursor-grabbing" />
                      <div className="grid size-10 place-items-center rounded-lg bg-rose-500/10 text-rose-500"><FileText className="size-5" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{f.name}</p>
                        <p className="font-mono text-xs text-slate-500">{f.pages} pages · {f.size}</p>
                      </div>
                      <button onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))} className="grid size-7 place-items-center rounded-md text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"><X className="size-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold tracking-tight">Preview</h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#111726] p-2 shadow-sm">
                      <div className="flex h-full flex-col gap-1.5 rounded bg-slate-100 dark:bg-white/5 p-2">
                        <div className="h-1.5 w-3/4 rounded bg-slate-300 dark:bg-white/15" />
                        <div className="h-1.5 w-full rounded bg-slate-200 dark:bg-white/10" />
                        <div className="h-1.5 w-5/6 rounded bg-slate-200 dark:bg-white/10" />
                        <div className="mt-auto text-[10px] font-medium text-slate-500">Page {i + 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto bg-white dark:bg-[#111726] p-6">
              <h3 className="font-semibold tracking-tight">Options</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Output quality</label>
                <input type="range" min={0} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-blue-600" />
                <p className="font-mono text-xs text-slate-500">{quality}% · balanced</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Page range</label>
                <select className="h-10 w-full rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-[#161d2e] px-3 text-sm outline-none">
                  <option>All pages</option><option>Odd pages</option><option>Even pages</option><option>Custom range…</option>
                </select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-black/5 dark:border-white/10 p-3">
                <div><p className="text-sm font-medium">Keep metadata</p><p className="text-xs text-slate-500">Preserve author & title</p></div>
                <SwitchControlled initial />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-black/5 dark:border-white/10 p-3">
                <div><p className="text-sm font-medium">Process offline</p><p className="text-xs text-slate-500">No upload to servers</p></div>
                <SwitchControlled initial={!tool.online} disabled={tool.online} />
              </div>
              <Button onClick={() => { setStage("processing"); setProgress(0); }} className="mt-auto h-11 w-full text-[15px]" style={{ backgroundColor: meta.accent }}>
                <Icon className="size-[18px]" /> {tool.name}
              </Button>
            </div>
          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid flex-1 place-items-center bg-slate-50 dark:bg-[#0a0e1a] p-6">
            <div className="w-full max-w-md text-center">
              <Loader2 className="mx-auto size-10 animate-spin" style={{ color: meta.accent }} />
              <h2 className="mt-5 text-lg font-semibold tracking-tight">Processing your files…</h2>
              <p className="mt-1 text-sm text-slate-500">Running {tool.name} on {files.length} file{files.length > 1 ? "s" : ""}</p>
              <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: meta.accent }} animate={{ width: `${progress}%` }} transition={{ ease: "easeOut" }} />
              </div>
              <p className="mt-2 font-mono text-sm text-slate-500">{Math.round(progress)}%</p>
              <Button variant="outline" className="mt-6" onClick={() => setStage("config")}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {stage === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid flex-1 place-items-center bg-slate-50 dark:bg-[#0a0e1a] p-6">
            <div className="w-full max-w-md">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/12 text-emerald-500"><CheckCircle2 className="size-9" /></motion.div>
              <h2 className="mt-5 text-center text-lg font-semibold tracking-tight">All done!</h2>
              <p className="mt-1 text-center text-sm text-slate-500">Your file is ready to download.</p>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#111726] p-4">
                <div className="grid size-11 place-items-center rounded-xl bg-rose-500/10 text-rose-500"><FileText className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tool.id}-output.pdf</p>
                  <p className="font-mono text-xs text-slate-500">1.8 MB · just now</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button className="col-span-2 h-11"><Download className="size-[18px]" /> Download</Button>
                <Button variant="outline"><FolderOpen className="size-4" /> Open folder</Button>
                <Button variant="outline" onClick={() => setStage("config")}><RotateCcw className="size-4" /> Start over</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SwitchControlled({ initial = false, disabled }: { initial?: boolean; disabled?: boolean }) {
  const [on, setOn] = useState(initial);
  return <Switch checked={on} onChange={setOn} disabled={disabled} />;
}

/* ────────────────────────────────────────────────────────────────────────
   CHAT WITH PDF
──────────────────────────────────────────────────────────────────────── */
interface Msg { id: number; role: "user" | "ai"; text: string; }
const SEED_MSGS: Msg[] = [
  { id: 1, role: "ai", text: "Hi! I've read Q2-Financial-Report.pdf (18 pages). Ask me anything about it — summaries, figures, or specific sections." },
  { id: 2, role: "user", text: "What was the total revenue in Q2?" },
  { id: 3, role: "ai", text: "Total revenue in Q2 was $4.82M, up 14% from Q1 ($4.23M). The largest contributor was the Enterprise segment at $2.6M (page 7)." },
];
const SUGGESTIONS = ["Summarize the key takeaways", "List all the figures on page 7", "What are the main risks mentioned?"];

function ChatWithPDF({ tool, dark, onBack }: { tool: Tool; dark: boolean; onBack: () => void }) {
  const meta = CATEGORY_META[tool.category];
  const [msgs, setMsgs] = useState<Msg[]>(SEED_MSGS);
  const [input, setInput] = useState("");
  const send = (text: string) => {
    if (!text.trim()) return;
    const id = msgs.length + 1;
    setMsgs((m) => [...m, { id, role: "user", text }]);
    setInput("");
    setTimeout(() => setMsgs((m) => [...m, { id: id + 1, role: "ai", text: "Based on the document, here's what I found: the report highlights steady margin improvement and a 9% reduction in operating costs this quarter (see page 11)." }]), 700);
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/10 px-6 py-4">
        <button onClick={onBack} className="grid size-9 place-items-center rounded-lg border border-black/10 dark:border-white/10 text-slate-500 transition-colors hover:bg-black/5 dark:hover:bg-white/5"><ArrowLeft className="size-[18px]" /></button>
        <div className="grid size-10 place-items-center rounded-xl" style={{ backgroundColor: dark ? meta.tintDark : meta.tint, color: meta.accent }}><Sparkles className="size-5" /></div>
        <div><h1 className="text-lg font-semibold leading-tight tracking-tight">{tool.name}</h1><p className="text-sm text-slate-500">Chatting with Q2-Financial-Report.pdf</p></div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-px overflow-hidden bg-black/5 dark:bg-white/10 lg:grid-cols-2">
        <div className="hidden flex-col items-center gap-3 overflow-y-auto bg-slate-50 dark:bg-[#0a0e1a] p-6 lg:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] w-full max-w-sm rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#111726] p-6 shadow-sm">
              <div className="flex h-full flex-col gap-2.5 rounded-lg bg-slate-100 dark:bg-white/5 p-5">
                <div className="h-3 w-1/2 rounded bg-slate-300 dark:bg-white/20" />
                <div className="mt-2 h-2 w-full rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-2 w-full rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-2 w-4/5 rounded bg-slate-200 dark:bg-white/10" />
                <div className="mt-auto text-xs font-medium text-slate-500">Q2-Financial-Report.pdf · Page {i + 1}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col bg-white dark:bg-[#111726]">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
            {msgs.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${m.role === "ai" ? "bg-violet-500/15 text-violet-500" : "bg-blue-500/15 text-blue-500"}`}>
                  {m.role === "ai" ? <Sparkles className="size-4" /> : <User className="size-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "ai" ? "bg-slate-100 dark:bg-white/5" : "bg-blue-600 text-white"}`}>{m.text}</div>
              </motion.div>
            ))}
          </div>
          <div className="border-t border-black/5 dark:border-white/10 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#0a0e1a] px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-blue-500/40 hover:text-slate-900 dark:hover:text-white">{s}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Ask anything about this document…"
                className="h-11 flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-[#161d2e] px-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20" />
              <Button onClick={() => send(input)} className="size-11 shrink-0 p-0"><Send className="size-[18px]" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   RECENT FILES
──────────────────────────────────────────────────────────────────────── */
interface Row { id: string; name: string; toolId: string; date: string; size: string; }
const RECENT_ROWS: Row[] = [
  { id: "r1", name: "Q2-Financial-Report_merged.pdf", toolId: "merge", date: "Today, 2:14 PM", size: "1.8 MB" },
  { id: "r2", name: "Contract-2026.docx", toolId: "pdf-to-word", date: "Today, 11:02 AM", size: "640 KB" },
  { id: "r3", name: "Scan-receipt_ocr.pdf", toolId: "ocr", date: "Yesterday, 6:48 PM", size: "320 KB" },
  { id: "r4", name: "Presentation_compressed.pdf", toolId: "compress", date: "Yesterday, 3:30 PM", size: "2.1 MB" },
  { id: "r5", name: "NDA_signed.pdf", toolId: "sign", date: "Jun 20, 2026", size: "410 KB" },
  { id: "r6", name: "Report-summary.txt", toolId: "summarize", date: "Jun 19, 2026", size: "12 KB" },
  { id: "r7", name: "Brochure_protected.pdf", toolId: "protect", date: "Jun 18, 2026", size: "3.4 MB" },
];

function RecentFiles({ onOpenTool }: { onOpenTool: (t: Tool) => void }) {
  const toolOf = (id: string) => TOOLS.find((t) => t.id === id);
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Recent Files</h1>
      <p className="mt-1 text-sm text-slate-500">Files you've processed recently. Stored locally on this device.</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#111726]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 font-medium">File</th>
              <th className="px-5 py-3 font-medium">Tool used</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Date</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">Size</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_ROWS.map((r) => {
              const tool = toolOf(r.toolId);
              const Icon = tool?.icon ?? FileText;
              return (
                <tr key={r.id} className="border-b border-black/5 dark:border-white/10 last:border-0 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-lg bg-rose-500/10 text-rose-500"><FileText className="size-[18px]" /></div>
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => tool && onOpenTool(tool)} className="inline-flex items-center gap-1.5 text-slate-500 transition-colors hover:text-blue-600"><Icon className="size-4" /> {tool?.name ?? "—"}</button>
                  </td>
                  <td className="hidden px-5 py-3 text-slate-500 sm:table-cell">{r.date}</td>
                  <td className="hidden px-5 py-3 font-mono text-slate-500 md:table-cell">{r.size}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" className="size-8 p-0" title="Re-run"><RotateCcw className="size-4" /></Button>
                      <Button variant="ghost" className="size-8 p-0" title="Download"><Download className="size-4" /></Button>
                      <Button variant="ghost" className="size-8 p-0" title="More"><MoreHorizontal className="size-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   SETTINGS
──────────────────────────────────────────────────────────────────────── */
function SettingsRow({ icon: Icon, title, desc, children }: { icon: LucideIcon; title: string; desc: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/10 px-5 py-4 last:border-0">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500"><Icon className="size-[18px]" /></div>
      <div className="min-w-0 flex-1"><p className="font-medium">{title}</p><p className="text-sm text-slate-500">{desc}</p></div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingsView({ dark, onToggleDark, online, onToggleOnline }: { dark: boolean; onToggleDark: () => void; online: boolean; onToggleOnline: () => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Configure how TinyLovePDF works on this device.</p>

      <section className="mt-6">
        <h3 className="mb-2 px-1 text-xs uppercase tracking-wider text-slate-500">Appearance</h3>
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#111726]">
          <SettingsRow icon={Moon} title="Dark theme" desc="Use the dark interface across the app"><Switch checked={dark} onChange={onToggleDark} /></SettingsRow>
          <SettingsRow icon={Globe} title="Language" desc="Interface and document language">
            <select className="h-9 w-40 rounded-lg border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-[#161d2e] px-2 text-sm outline-none">
              <option>English</option><option>اردو</option><option>Español</option><option>Français</option><option>Deutsch</option>
            </select>
          </SettingsRow>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-2 px-1 text-xs uppercase tracking-wider text-slate-500">Files & Processing</h3>
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#111726]">
          <SettingsRow icon={FolderOpen} title="Default save location" desc="C:\\Users\\Ayesha\\Documents\\TinyLovePDF"><Button variant="outline">Change</Button></SettingsRow>
          <SettingsRow icon={Wifi} title="Offline mode" desc="Process files locally without uploading"><Switch checked={!online} onChange={onToggleOnline} /></SettingsRow>
          <SettingsRow icon={HardDrive} title="Auto-clear temp files" desc="Remove temporary files after each task"><SwitchControlled initial /></SettingsRow>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-2 px-1 text-xs uppercase tracking-wider text-slate-500">Notifications</h3>
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#111726]">
          <SettingsRow icon={Bell} title="Task completion alerts" desc="Notify me when a task finishes"><SwitchControlled initial /></SettingsRow>
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-slate-500">TinyLovePDF v2.4.1 · 37 tools · © 2026</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   APP
──────────────────────────────────────────────────────────────────────── */
const MENUS = ["File", "Edit", "View", "Window", "Help"];

export default function App() {
  const [dark, setDark] = useState(true);
  const [online, setOnline] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ kind: "category", category: "All Tools" });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Update native window controls if running in Electron
    if (typeof window !== "undefined" && (window as any).electronAPI?.setTheme) {
      (window as any).electronAPI.setTheme(dark);
    }
  }, [dark]);

  const openTool = (tool: Tool) => setView({ kind: "tool", toolId: tool.id });
  const activeTool = view.kind === "tool" ? TOOLS.find((t) => t.id === view.toolId) ?? null : null;
  const navigate = (v: View) => { setQuery(""); setView(v); };
  const backToHome = () => navigate({ kind: "category", category: "All Tools" });

const isMac = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes("mac");

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0a0e1a] dark:text-slate-100"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {/* Title + menu bar */}
        <div style={{ WebkitAppRegion: "drag" } as React.CSSProperties} className="flex h-9 shrink-0 items-center gap-4 border-b border-black/5 dark:border-white/10 bg-white dark:bg-[#0d1320] px-3 text-[13px] text-slate-500 select-none">
          {isMac && (
            <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
            </div>
          )}
          <div className="ml-1 flex items-center gap-3" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
            {MENUS.map((m) => <button key={m} className="rounded px-1.5 py-0.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white">{m}</button>)}
          </div>
          <span className="mx-auto font-medium text-slate-700 dark:text-slate-300">TheyLovePDF</span>
          <span className="w-16" />
        </div>

        <div className="flex min-h-0 flex-1">
          <Sidebar view={view} onNavigate={navigate} collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar query={query} onQuery={setQuery} online={online} onToggleOnline={() => setOnline((o) => !o)} dark={dark} onToggleDark={() => setDark((d) => !d)} />
            <main className="min-h-0 flex-1 overflow-y-auto">
              {view.kind === "category" && (
                <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
                  <div className="mb-6">
                    <h1 className="text-xl font-semibold tracking-tight">{view.category === "All Tools" ? "All Tools" : view.category}</h1>
                    <p className="mt-1 text-sm text-slate-500">
                      {view.category === "All Tools" ? "Every tool you need to work with PDFs — online and offline." : `Tools for ${view.category.toLowerCase()}.`}
                    </p>
                  </div>
                  <div className="mb-7"><DropZone /></div>
                  <ToolGrid filter={view.category} query={query} dark={dark} onOpen={openTool} />
                </div>
              )}
              {view.kind === "tool" && activeTool && (
                activeTool.id === "chat"
                  ? <ChatWithPDF tool={activeTool} dark={dark} onBack={backToHome} />
                  : <ToolWorkspace tool={activeTool} dark={dark} onBack={backToHome} />
              )}
              {view.kind === "recent" && <RecentFiles onOpenTool={openTool} />}
              {view.kind === "settings" && <SettingsView dark={dark} onToggleDark={() => setDark((d) => !d)} online={online} onToggleOnline={() => setOnline((o) => !o)} />}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
