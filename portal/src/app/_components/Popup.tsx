'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchActivePopup, type PublicPopup } from '../../lib/popup/api';
import styles from './popup.module.css';

const COOKIE_MAX_AGE_30D = 60 * 60 * 24 * 30;

function hasSeenCookie(id: string): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith(`popup-seen-${id}=`));
}

function markSeenCookie(id: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `popup-seen-${id}=1; path=/; max-age=${COOKIE_MAX_AGE_30D}; SameSite=Lax`;
}

/** Regra `show_on_pages`: `all` em qualquer rota; `home` só na raiz. */
function isPageAllowed(showOnPages: PublicPopup['showOnPages'], pathname: string): boolean {
  if (showOnPages === 'all') return true;
  return pathname === '/';
}

export default function Popup() {
  const pathname = usePathname();
  const [popup, setPopup] = useState<PublicPopup | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Busca o popup ativo do tenant uma vez na montagem.
  useEffect(() => {
    let active = true;
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    fetchActivePopup(host)
      .then((data) => {
        if (active) setPopup(data);
      })
      .catch((error) => {
        console.error('Erro ao carregar o popup:', error);
      });
    return () => {
      active = false;
    };
  }, []);

  // Agenda a exibição respeitando página atual, cookie de "já vi" e o delay.
  // `setIsVisible` só roda dentro do setTimeout (deferido) — nunca síncrono no
  // corpo do effect.
  useEffect(() => {
    if (!popup) return;
    if (!isPageAllowed(popup.showOnPages, pathname)) return;
    if (popup.showOnlyOnce && hasSeenCookie(popup.id)) return;

    const timer = setTimeout(() => setIsVisible(true), popup.showAfterSeconds * 1000);
    return () => clearTimeout(timer);
  }, [popup, pathname]);

  const handleClose = () => {
    setIsVisible(false);
    if (popup && popup.showOnlyOnce) {
      markSeenCookie(popup.id);
    }
  };

  const handleLinkClick = () => {
    if (popup && popup.showOnlyOnce) {
      markSeenCookie(popup.id);
    }
  };

  if (!popup || !isVisible) return null;
  // Re-checa a rota no render: cobre navegação client-side para página não
  // permitida enquanto o popup estava visível.
  if (!isPageAllowed(popup.showOnPages, pathname)) return null;

  const hasContent = popup.imageUrl || popup.htmlContent;
  if (!hasContent) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.wrapper}
        role="dialog"
        aria-modal="true"
        aria-label={popup.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Fechar anúncio"
        >
          &times;
        </button>

        {popup.linkUrl ? (
          <a
            href={popup.linkUrl}
            className={styles.contentLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
          >
            <PopupContent popup={popup} />
          </a>
        ) : (
          <div className={styles.contentWrapper}>
            <PopupContent popup={popup} />
          </div>
        )}
      </div>
    </div>
  );
}

function PopupContent({ popup }: { popup: PublicPopup }) {
  return (
    <>
      {popup.imageUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={popup.imageUrl} alt={popup.title} className={styles.image} />
      )}

      {popup.htmlContent && (
        <div
          className={styles.htmlContainer}
          dangerouslySetInnerHTML={{ __html: popup.htmlContent }}
        />
      )}
    </>
  );
}
