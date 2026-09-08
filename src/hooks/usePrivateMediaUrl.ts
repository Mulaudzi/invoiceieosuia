import { useEffect, useState } from 'react';
import api from '@/services/api';
import { mediaUrl } from '@/lib/mediaUrl';

export function usePrivateMediaUrl(value?: string | null): string {
  const normalized = mediaUrl(value);
  const [resolved, setResolved] = useState(() => normalized.startsWith('blob:') || normalized.startsWith('data:') ? normalized : '');
  useEffect(() => {
    if (!normalized) { setResolved(''); return; }
    if (normalized.startsWith('blob:') || normalized.startsWith('data:')) { setResolved(normalized); return; }
    let active=true, objectUrl='';
    const pathname = /^https?:\/\//i.test(normalized) ? new URL(normalized).pathname : normalized;
    // The Axios instance already points at `/api`; avoid requesting `/api/api/media/...`.
    const path = pathname.replace(/^\/api(?=\/)/, '');
    api.get<Blob>(path,{responseType:'blob'}).then(response=>{
      objectUrl=URL.createObjectURL(response.data);
      if(active)setResolved(objectUrl);
    }).catch(()=>active&&setResolved(''));
    return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)};
  },[normalized]);
  return resolved;
}
