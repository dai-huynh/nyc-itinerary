export function getPlacePhotoUrl(photoName: string, maxWidth = 400): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
}
