import React, { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = document.querySelector('.main-area');
    if (!container) return undefined;
    const onScroll = () => setVisible(container.scrollTop > 24);
    onScroll();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      className="back-to-top"
      type="button"
      onClick={() => {
        const container = document.querySelector('.main-area');
        if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
