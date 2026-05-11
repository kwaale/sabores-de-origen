const XLSX = require('xlsx');
const fs = require('fs');

const INPUT_FILE = 'productos.xlsx';
const OUTPUT_FILE = 'products.json';

const workbook = XLSX.readFile(INPUT_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

const data = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: null
});

// Columnas fijas según estructura del archivo
const COL_CODIGO = 2;
const COL_NOMBRE = 4;
const COL_PRECIO = 8;

const result = {};
const seenCodes = new Set();
let currentCategoria = null;

data.forEach((row) => {
  const codigo = row[COL_CODIGO];
  const nombre = row[COL_NOMBRE];
  const precio = row[COL_PRECIO];

  // Fila de categoría: tiene texto en col 2, sin nombre ni precio
  if (
    typeof codigo === 'string' &&
    codigo.trim() &&
    !nombre &&
    !precio &&
    !/^\d+$/.test(codigo.trim()) &&
    codigo.trim() !== 'Código Barra'
  ) {
    currentCategoria = codigo.trim().toUpperCase();
    return;
  }

  // Fila de datos: código numérico largo, nombre texto, precio número
  if (
    currentCategoria &&
    typeof codigo === 'string' &&
    /^\d{6,}$/.test(codigo.trim()) &&
    typeof nombre === 'string' &&
    nombre.trim() &&
    typeof precio === 'number' &&
    precio > 0
  ) {
    const cod = codigo.trim();
    if (seenCodes.has(cod)) return;
    seenCodes.add(cod);

    if (!result[currentCategoria]) result[currentCategoria] = [];
    result[currentCategoria].push({
      codigo: cod,
      nombre: nombre.trim(),
      mayorista: precio
    });
  }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));

console.log('Productos procesados:', seenCodes.size);
console.log('Categorías generadas:', Object.keys(result).length);
console.log('✅ JSON generado correctamente');