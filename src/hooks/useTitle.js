import { useEffect } from 'react';

export function useTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | Veltrix Social` : 'Veltrix Social';
    
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
