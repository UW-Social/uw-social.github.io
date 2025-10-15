import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export async function loadGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_GOOGLE_MAPS_API_KEY is missing');

  setOptions({ apiKey, version: 'weekly', libraries: ['places'] });

  // 按需加载库；这一行确保 google.maps.* 可用
  await importLibrary('maps');
  // 如需 Places 再加载
  await importLibrary('places');

  return (window as any).google;
}