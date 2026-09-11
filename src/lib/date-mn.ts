// Монгол огнооны формат.
//
// Бүх огноо серверийн/браузерын ЛОКАЛ цагаар "YYYY-MM-DD" мөр байна — UTC биш.
// toISOString() ашиглавал орой болоход нэг өдрөөр зөрөх эрсдэлтэй.

const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

const MONTHS = [
  "1-р сарын", "2-р сарын", "3-р сарын", "4-р сарын",
  "5-р сарын", "6-р сарын", "7-р сарын", "8-р сарын",
  "9-р сарын", "10-р сарын", "11-р сарын", "12-р сарын",
];

/** "YYYY-MM-DD" локал огноо. */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

/**
 * Маргаашийн огноо.
 * Зөвхөн ХАРУУЛАХ зорилгоор — бүртгэл хийхдээ серверийн буцаасан огноог
 * ашиглана (таблетын цаг буруу байж болзошгүй).
 */
export function tomorrowString(): string {
  const now = new Date();
  return toDateString(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
  );
}

/** "2026 оны 9-р сарын 8, Даваа гараг" */
export function formatMongolianDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getFullYear()} оны ${MONTHS[d.getMonth()]} ${d.getDate()}, ${WEEKDAYS[d.getDay()]} гараг`;
}

/** "9-р сарын 8, Даваа" — богино хувилбар */
export function formatMongolianShort(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${WEEKDAYS[d.getDay()]}`;
}
