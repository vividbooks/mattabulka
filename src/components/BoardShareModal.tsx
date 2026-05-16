import { useState } from 'react';
import { ClipboardCheck, Copy, QrCode, Users, X } from 'lucide-react';
import { AuthStrip } from './AuthStrip';

type Props = {
  open: boolean;
  shareUrl: string | null;
  taskShareUrl?: string | null;
  /** Odkaz #live= pro živou spolupráci (Realtime Broadcast v aplikaci). */
  liveShareUrl?: string | null;
  hasGradableTask?: boolean;
  cloudEnabled?: boolean;
  signedIn?: boolean;
  busy?: boolean;
  error?: string | null;
  onCreateContentShare: () => void;
  onCreateTaskShare: () => void;
  onStartLiveSession?: () => void;
  onClose: () => void;
};

export function BoardShareModal({
  open,
  shareUrl,
  taskShareUrl = null,
  liveShareUrl = null,
  hasGradableTask = false,
  cloudEnabled = true,
  signedIn = true,
  busy = false,
  error = null,
  onCreateContentShare,
  onCreateTaskShare,
  onStartLiveSession,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedLive, setCopiedLive] = useState(false);

  if (!open) return null;

  const resultUrl = taskShareUrl ?? shareUrl;
  const qrUrl = resultUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(resultUrl)}`
    : null;
  const liveQrUrl = liveShareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(liveShareUrl)}`
    : null;
  const resultLabel = taskShareUrl ? 'Odkaz na úkol' : 'Odkaz pro studenty';
  const canCreateShare = cloudEnabled && signedIn && !busy;
  const canStartLive = Boolean(onStartLiveSession) && canCreateShare;
  const primaryShareUrl = hasGradableTask ? taskShareUrl : shareUrl;

  return (
    <div className="board-cloud-modal-root" role="presentation">
      <button type="button" className="board-cloud-modal__backdrop" aria-label="Zavřít" onClick={onClose} />
      <div className="board-cloud-modal board-share-modal" role="dialog" aria-modal="true" aria-labelledby="board-share-title">
        <div className="board-cloud-modal__head">
          <h2 id="board-share-title" className="board-cloud-modal__title">
            Sdílení se žáky
          </h2>
          <button type="button" className="board-cloud-modal__close" onClick={onClose} aria-label="Zavřít">
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>
        <div className="board-share-modal__body">
          {!cloudEnabled ? (
            <section className="board-share-auth">
              <strong>Supabase teď ve frontendu není nakonfigurovaný.</strong>
              <p>Chybí hodnoty `VITE_SUPABASE_URL` a/nebo `VITE_SUPABASE_ANON_KEY` v lokálním `.env.local`, takže není kam uložit odkazy, jména ani skóre.</p>
            </section>
          ) : !signedIn ? (
            <section className="board-share-auth">
              <strong>Nejdřív se přihlas jako učitel.</strong>
              <p>Odkaz, QR kód, odevzdání a výsledky se ukládají do tvého Supabase účtu.</p>
              <AuthStrip />
            </section>
          ) : null}

          <section className="board-share-card">
            <div className="board-share-card__icon">
              <Users size={22} strokeWidth={2.2} aria-hidden />
            </div>
            <div>
              <h3>Připojit studenty live</h3>
              <p>
                Společná nástěnka přes internet: odkaz nebo QR, sdílení úprav (poslední změna podle času) a kurzory
                účastníků. Nepotřebují účet; funguje to přes zabezpečený kanál podle tajného odkazu.
              </p>
              <button
                type="button"
                className="board-share-modal__secondary"
                disabled={!canStartLive}
                onClick={() => onStartLiveSession?.()}
              >
                {busy ? 'Spouštím…' : liveShareUrl ? 'Nová živá místnost' : 'Spustit živou místnost'}
              </button>
            </div>
          </section>

          <section className="board-share-card">
            <div className="board-share-card__icon">
              {hasGradableTask ? (
                <ClipboardCheck size={22} strokeWidth={2.2} aria-hidden />
              ) : (
                <QrCode size={22} strokeWidth={2.2} aria-hidden />
              )}
            </div>
            <div>
              <h3>{hasGradableTask ? 'Sdílet jako úkol' : 'Sdílet obsah'}</h3>
              <p>
                {hasGradableTask
                  ? 'Na nástěnce jsou hodnotitelné aktivity, takže student odevzdá řešení a učiteli se uloží i skóre.'
                  : 'Na nástěnce nejsou hodnotitelné aktivity, takže student odevzdá svoji kopii bez automatického skóre.'}
              </p>
              <button
                type="button"
                className="board-share-modal__primary"
                disabled={!canCreateShare}
                onClick={hasGradableTask ? onCreateTaskShare : onCreateContentShare}
              >
                {busy ? 'Vytvářím…' : primaryShareUrl ? 'Vytvořit nový odkaz' : 'Vytvořit odkaz'}
              </button>
            </div>
          </section>

          {error ? <p className="board-cloud-modal__error">{error}</p> : null}

          {liveShareUrl ? (
            <div className="board-share-result board-share-result--live">
              <p className="board-share-result__title">Živá místnost</p>
              {liveQrUrl ? <img className="board-share-result__qr" src={liveQrUrl} alt="QR kód pro živou místnost" /> : null}
              <div className="board-share-result__link-row">
                <input readOnly value={liveShareUrl} aria-label="Odkaz živé místnosti" />
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(liveShareUrl);
                    setCopiedLive(true);
                    window.setTimeout(() => setCopiedLive(false), 1600);
                  }}
                >
                  <Copy size={16} strokeWidth={2.2} aria-hidden />
                  {copiedLive ? 'Zkopírováno' : 'Kopírovat'}
                </button>
              </div>
            </div>
          ) : null}

          {resultUrl ? (
            <div className="board-share-result">
              {qrUrl ? <img className="board-share-result__qr" src={qrUrl} alt="QR kód pro sdílení" /> : null}
              <div className="board-share-result__link-row">
                <input readOnly value={resultUrl} aria-label={resultLabel} />
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(resultUrl);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                  }}
                >
                  <Copy size={16} strokeWidth={2.2} aria-hidden />
                  {copied ? 'Zkopírováno' : 'Kopírovat'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
