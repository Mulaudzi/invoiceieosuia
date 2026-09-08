export const mediaUrl = (value?: string | null): string => {
  if (!value) return '';
  const normalized = value.replace('/api/uploads/', '/api/media/');
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('blob:') || normalized.startsWith('data:')) return normalized;
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};
