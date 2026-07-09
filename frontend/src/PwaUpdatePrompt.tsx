import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) {
    return null;
  }

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div role="status" className="pwa-toast">
      <span>{needRefresh ? "New version available." : "Isle of Love is ready to work offline."}</span>
      {needRefresh && (
        <button type="button" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
      )}
      <button type="button" onClick={close} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
