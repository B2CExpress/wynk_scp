'use client';

import { useEffect, useState } from 'react';
import { fetchActivePopup, type PublicPopup } from '../../lib/popup/api'; // Ajuste o caminho do seu mock aqui
import styles from './popup.module.css';

export default function Popup() {
  const [popup, setPopup] = useState<PublicPopup | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function loadPopup() {
      try {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
        const activePopup = await fetchActivePopup(currentHost);

        if (!activePopup) return;

        if (activePopup.showOnlyOnce) {
          const hasSeen = localStorage.getItem(`popup:seen:${activePopup.id}`);
          if (hasSeen) return; // Se já viu, não faz mais nada
        }

        setPopup(activePopup);

        const delayMs = activePopup.showAfter_seconds * 1000;
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, delayMs);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Erro ao carregar o popup:', error);
      }
    }

    loadPopup();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (popup && popup.showOnlyOnce) {
      // Salva no navegador que o usuário já fechou este popup específico
      localStorage.setItem(`popup:seen:${popup.id}`, 'true');
    }
  };

  if (!popup || !isVisible) {
    return null;
  }

  const hasContent = popup.imageUrl || popup.htmlContent;
  if (!hasContent) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      {/* O stopPropagation impede que o popup feche se o usuário clicar dentro dele */}
      <div className={styles.wrapper} onClick={(e) => e.stopPropagation()}>
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
