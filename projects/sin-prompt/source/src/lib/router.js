import { useEffect, useState } from 'react';

const read = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0];

export function navigate(path, { replace = false } = {}) {
  const url = '#' + path;
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  window.dispatchEvent(new Event('hashchange'));
}

export function useRoute() {
  const [path, setPath] = useState(read);
  useEffect(() => {
    const on = () => setPath(read());
    window.addEventListener('hashchange', on);
    window.addEventListener('popstate', on);
    return () => {
      window.removeEventListener('hashchange', on);
      window.removeEventListener('popstate', on);
    };
  }, []);
  return path;
}
