/** Тоо хэмжээ — 3 хүртэл аравтын орон */
export function formatQty(n: number): string {
  return new Intl.NumberFormat("mn-MN", {
    maximumFractionDigits: 3,
  }).format(n);
}

/** Мөнгөн дүн — бүхэл төгрөгөөр */
export function formatMoney(n: number): string {
  return new Intl.NumberFormat("mn-MN", {
    maximumFractionDigits: 0,
  }).format(n);
}

/** Excel монгол текстийг зөв уншихын тулд UTF-8 BOM-той CSV татах */
export function downloadCSV(
  filename: string,
  header: string[],
  rows: string[][]
) {
  const escape = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const csv = [header, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");

  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
