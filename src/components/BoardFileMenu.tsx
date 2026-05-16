import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, ChevronDown, Menu, Settings, Share2, Shapes, Sun } from 'lucide-react';
import type { BoardDocumentMetadata } from '../lib/boardDocument';
import { AuthStrip } from './AuthStrip';

interface BoardFileMenuProps {
  fileLabel: string;
  documentDirty: boolean;
  metadata?: BoardDocumentMetadata;
  onMetadataChange?: (next: BoardDocumentMetadata) => void;
  onNew: () => void;
  onOpenClick: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  /** Když je uživatel přihlášen a Supabase zapnuté */
  cloudAvailable?: boolean;
  onCloudSave?: () => void;
  onOpenCloud?: () => void;
  onBackgroundSettings?: () => void;
  onShare?: () => void;
  onTaskResults?: () => void;
  onOpenLibrary?: () => void;
  libraryOpen?: boolean;
  triggerRef?: Ref<HTMLButtonElement>;
  variant?: 'document' | 'menu';
  /** Světlé okolí plátna (#DEE4F1) místo výchozího tmavého chromu. */
  lightUiMode?: boolean;
  onLightUiModeChange?: (next: boolean) => void;
}

/**
 * Kompaktní „název souboru“ — rozbalí nabídku Nový / Otevřít / Uložit (viz výchozí styl aplikace).
 */
export function BoardFileMenu({
  fileLabel,
  documentDirty,
  metadata,
  onMetadataChange,
  onNew,
  onOpenClick,
  onSave,
  onSaveAs,
  cloudAvailable = false,
  onCloudSave,
  onOpenCloud,
  onBackgroundSettings,
  onShare,
  onTaskResults,
  onOpenLibrary,
  libraryOpen = false,
  triggerRef,
  variant = 'document',
  lightUiMode = false,
  onLightUiModeChange,
}: BoardFileMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const [portalMenuStyle, setPortalMenuStyle] = useState<CSSProperties | null>(null);
  const isMenuVariant = variant === 'menu';

  const setTriggerRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerButtonRef.current = node;
      if (!triggerRef) return;
      if (typeof triggerRef === 'function') {
        triggerRef(node);
      } else {
        triggerRef.current = node;
      }
    },
    [triggerRef],
  );

  const updatePortalMenuPosition = useCallback(() => {
    if (!isMenuVariant || !open) return;
    const trigger = triggerButtonRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPad = 12;
    const gap = 10;
    const menuWidth = Math.min(320, Math.max(260, window.innerWidth - viewportPad * 2));
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - menuWidth - 12);
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const spaceAbove = rect.top - viewportPad - gap;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPad - gap;
    const openAbove = spaceAbove >= Math.min(menuHeight, 320) || spaceAbove >= spaceBelow;
    const maxHeight = Math.max(160, openAbove ? spaceAbove : spaceBelow);
    const top = openAbove
      ? Math.max(viewportPad, rect.top - gap - Math.min(menuHeight || maxHeight, maxHeight))
      : Math.min(window.innerHeight - viewportPad - maxHeight, rect.bottom + gap);

    setPortalMenuStyle({
      position: 'fixed',
      left,
      top,
      bottom: 'auto',
      width: menuWidth,
      maxHeight,
      overflowY: 'auto',
      /* Nad levým dokem knihovny (--library-chrome-z 420) a plovoucí knihovnou (+20). */
      zIndex: 25000,
    });
  }, [isMenuVariant, open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      if (wrapRef.current) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close, true);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close, true);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !isMenuVariant) {
      setPortalMenuStyle(null);
      return undefined;
    }

    updatePortalMenuPosition();
    window.addEventListener('resize', updatePortalMenuPosition);
    window.addEventListener('scroll', updatePortalMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updatePortalMenuPosition);
      window.removeEventListener('scroll', updatePortalMenuPosition, true);
    };
  }, [isMenuVariant, open, updatePortalMenuPosition]);

  const menu = (
    <div
      className={`board-file-dropdown__menu${isMenuVariant ? ' board-file-dropdown__menu--portal' : ''}`}
      role="menu"
      ref={menuRef}
      style={isMenuVariant && portalMenuStyle ? portalMenuStyle : undefined}
    >
      <div className="board-file-dropdown__document" title={fileLabel}>
        <span className="board-file-dropdown__document-kicker">Dokument</span>
        <span className="board-file-dropdown__document-name">
          {documentDirty ? '● ' : ''}
          {fileLabel}
        </span>
      </div>
      {metadata && onMetadataChange ? (
        <div className="board-file-dropdown__metadata" aria-label="Nastavení dokumentu">
          <label>
            <span>Předmět</span>
            <select
              value={metadata.subject}
              onChange={(event) => onMetadataChange({ ...metadata, subject: event.target.value })}
            >
              <option value="Matematika">Matematika</option>
            </select>
          </label>
          <label>
            <span>Ročník</span>
            <select
              value={metadata.grade}
              onChange={(event) => onMetadataChange({ ...metadata, grade: event.target.value })}
            >
              <option value="">Vybrat</option>
              {Array.from({ length: 9 }, (_, index) => String(index + 1)).map((grade) => (
                <option key={grade} value={grade}>
                  {grade}. ročník
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Díl</span>
            <select
              value={metadata.part}
              onChange={(event) => onMetadataChange({ ...metadata, part: event.target.value })}
            >
              <option value="">Vybrat</option>
              <option value="1">1. díl</option>
              <option value="2">2. díl</option>
              <option value="3">3. díl</option>
              <option value="4">4. díl</option>
            </select>
          </label>
        </div>
      ) : null}
      <div className="board-file-dropdown__auth">
        <span className="board-file-dropdown__auth-label">Učitel</span>
        <AuthStrip />
      </div>
      {onLightUiModeChange ? (
        <>
          <button
            type="button"
            className="board-file-dropdown__item"
            role="menuitemcheckbox"
            aria-checked={lightUiMode}
            onClick={() => onLightUiModeChange(!lightUiMode)}
          >
            <span className="board-file-dropdown__item-label">
              <Sun size={16} strokeWidth={2.25} aria-hidden />
              Světlý vzhled rozhraní
            </span>
            <span className="board-file-dropdown__kbd">{lightUiMode ? 'Ano' : 'Ne'}</span>
          </button>
          <div className="board-file-dropdown__sep" />
        </>
      ) : null}
      {onOpenLibrary ? (
        <>
          <button
            type="button"
            className="board-file-dropdown__item"
            role="menuitem"
            aria-pressed={libraryOpen}
            onClick={() => {
              setOpen(false);
              onOpenLibrary();
            }}
          >
            <span className="board-file-dropdown__item-label">
              <Shapes size={16} strokeWidth={2.25} aria-hidden />
              Knihovna funkcí
            </span>
          </button>
          <div className="board-file-dropdown__sep" />
        </>
      ) : null}
      {onBackgroundSettings || onShare || onTaskResults ? (
        <>
          <div className="board-file-dropdown__sep" />
          {onBackgroundSettings ? (
            <button
              type="button"
              className="board-file-dropdown__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onBackgroundSettings();
              }}
            >
              <span className="board-file-dropdown__item-label">
                <Settings size={16} strokeWidth={2.25} aria-hidden />
                Nastavení dokumentu…
              </span>
            </button>
          ) : null}
          {onShare ? (
            <button
              type="button"
              className="board-file-dropdown__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onShare();
              }}
            >
              <span className="board-file-dropdown__item-label">
                <Share2 size={16} strokeWidth={2.25} aria-hidden />
                Sdílet se žáky…
              </span>
            </button>
          ) : null}
          {onTaskResults ? (
            <button
              type="button"
              className="board-file-dropdown__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onTaskResults();
              }}
            >
              <span className="board-file-dropdown__item-label">
                <BarChart3 size={16} strokeWidth={2.25} aria-hidden />
                Výsledky žáků…
              </span>
            </button>
          ) : null}
        </>
      ) : null}
      <button type="button" className="board-file-dropdown__item" role="menuitem" onClick={() => { setOpen(false); onNew(); }}>
        Nový dokument…
        <span className="board-file-dropdown__kbd">⌘N</span>
      </button>
      <button type="button" className="board-file-dropdown__item" role="menuitem" onClick={() => { setOpen(false); onOpenClick(); }}>
        Otevřít…
        <span className="board-file-dropdown__kbd">⌘O</span>
      </button>
      <div className="board-file-dropdown__sep" />
      <button type="button" className="board-file-dropdown__item" role="menuitem" onClick={() => { setOpen(false); onSave(); }}>
        Uložit
        <span className="board-file-dropdown__kbd">⌘S</span>
      </button>
      <button type="button" className="board-file-dropdown__item" role="menuitem" onClick={() => { setOpen(false); onSaveAs(); }}>
        Uložit jako…
        <span className="board-file-dropdown__kbd">⇧⌘S</span>
      </button>
      {cloudAvailable && (onCloudSave || onOpenCloud) ? (
        <>
          <div className="board-file-dropdown__sep" />
          {onCloudSave ? (
            <button
              type="button"
              className="board-file-dropdown__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onCloudSave();
              }}
            >
              Uložit do cloudu…
            </button>
          ) : null}
          {onOpenCloud ? (
            <button
              type="button"
              className="board-file-dropdown__item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenCloud();
              }}
            >
              Otevřít z cloudu…
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );

  return (
    <div className="board-file-dropdown" ref={wrapRef}>
      <button
        ref={setTriggerRefs}
        type="button"
        className={`board-file-dropdown__trigger${isMenuVariant ? ' board-file-dropdown__trigger--menu' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={isMenuVariant ? 'Menu' : fileLabel}
        aria-label={isMenuVariant ? 'Menu nástěnky' : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {isMenuVariant ? (
          <Menu size={19} strokeWidth={2.35} aria-hidden />
        ) : (
          <>
            <span className="board-file-dropdown__dirty" aria-hidden={!documentDirty}>
              {documentDirty ? '●' : ''}
            </span>
            <span className="board-file-dropdown__name">{fileLabel}</span>
            <ChevronDown size={16} strokeWidth={2.4} className="board-file-dropdown__chevron" aria-hidden />
          </>
        )}
      </button>
      {open ? (isMenuVariant && portalMenuStyle ? createPortal(menu, document.body) : menu) : null}
    </div>
  );
}
