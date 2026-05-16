import { useEffect } from 'react';
import { FreeformBoard } from './components/FreeformBoard';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

/** Zabrání systémovému zoomu celé stránky při pinch / Ctrl+kolíčku (plátno má vlastní zoom). */
function useBlockBrowserWheelZoom() {
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };
    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, []);
}

export default function App() {
  useBlockBrowserWheelZoom();
  return (
    <SupabaseAuthProvider>
      <FreeformBoard />
    </SupabaseAuthProvider>
  );
}
