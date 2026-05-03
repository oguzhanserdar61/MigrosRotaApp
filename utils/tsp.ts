import { haversine } from './haversine';

export interface Nokta { id: string; lat: number; lng: number; }
export interface Point { lat: number; lng: number; label?: string; }

function totalDist(order: Nokta[], start?: Point | null, end?: Point | null): number {
  let d = 0;
  const path: { lat: number; lng: number }[] = [];
  if (start) path.push(start);
  order.forEach(p => path.push(p));
  if (end) path.push(end);

  for (let i = 1; i < path.length; i++) {
    d += haversine(path[i-1].lat, path[i-1].lng, path[i].lat, path[i].lng);
  }
  return d;
}

export function optimizeRoute(points: Nokta[], start?: Point | null, end?: Point | null): Nokta[] {
  if (points.length === 0) return [];
  if (points.length === 1) return points;

  // Başlangıç noktası verilmişse, ona en yakın olandan başla
  // Bitiş noktası verilmişse, ona en yakın olanla bitir

  let bestTour: Nokta[] = [];
  let bestDist = Infinity;

  // Multi-start Nearest Neighbor
  // Eğer startPoint varsa, sadece ona en yakın olandan başlamayı deneyebiliriz
  // Ama daha iyisi tüm noktaları başlangıç adayı olarak denemek (TSP standardı)
  const candidateStarts = points.length <= 12 ? points : points.slice(0, 8);

  for (const startPt of candidateStarts) {
    let rem = points.filter(p => p.id !== startPt.id);
    let tour: Nokta[] = [startPt];
    let cur = startPt;

    // Eğer startPoint varsa, ilk mesafe startPoint -> startPt olacak
    while (rem.length > 0) {
      let bi = -1, bd = Infinity;
      for (let i = 0; i < rem.length; i++) {
        const d = haversine(cur.lat, cur.lng, rem[i].lat, rem[i].lng);
        if (d < bd) { bd = d; bi = i; }
      }
      const next = rem.splice(bi, 1)[0];
      tour.push(next);
      cur = next;
    }

    const d = totalDist(tour, start, end);
    if (d < bestDist) {
      bestDist = d;
      bestTour = [...tour];
    }
  }

  // 2-opt Refinement
  let improved = true;
  let iter = 0;
  const maxIter = 500;

  while (improved && iter < maxIter) {
    improved = false;
    iter++;
    for (let i = 0; i < bestTour.length - 1; i++) {
      for (let j = i + 1; j < bestTour.length; j++) {
        const newTour = [
          ...bestTour.slice(0, i),
          ...bestTour.slice(i, j + 1).reverse(),
          ...bestTour.slice(j + 1)
        ];
        const newD = totalDist(newTour, start, end);
        if (newD < bestDist - 0.0001) {
          bestDist = newD;
          bestTour = newTour;
          improved = true;
        }
      }
    }
  }

  return bestTour;
}

