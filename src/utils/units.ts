export const MM = 0.001; // 1 мм в единицах three.js (метры)
export const MM_INV = 1000; // коэффициент перевода единиц в миллиметры

export function mm(value: number): number {
  return value * MM;
}

export function toMM(value: number): number {
  return value * MM_INV;
}
