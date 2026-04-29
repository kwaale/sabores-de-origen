const XLSX = require('xlsx');
const fs = require('fs');

const INPUT_FILE = 'productos.xlsx';
const OUTPUT_FILE = 'products.json';

const workbook = XLSX.readFile(INPUT_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Leer como array (NO como objetos)
const data = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: ''
});
console.log(data.slice(0,5));
const result = {};
const errors = [];
const seenCodes = new Set();

data.forEach((row, index) => {
  const line = index + 1;

  // Buscar valores reales dentro de la fila
  const values = row.filter(v => v !== '');

  if (values.length < 3) return; // fila basura

  let codigo = '';
  let nombre = '';
  let precio = 0;

  values.forEach(v => {
    const val = String(v).trim();

    // Código: número largo (ej: 9791000001449)
    if (/^\d{6,}$/.test(val) && !codigo) {
      codigo = val;
      return;
    }

    // Precio: número razonable
    if (typeof v === 'number' && v > 100 && v < 1000000 && !precio) {
      precio = v;
      return;
    }

    // Nombre: texto largo
    if (val.length > 10 && isNaN(val) && !nombre) {
      nombre = val;
    }
  });

  // Validaciones
  if (!codigo || !nombre || !precio) {
    return; // ignoramos filas inválidas
  }

  if (seenCodes.has(codigo)) return;
  seenCodes.add(codigo);

  const categoria = nombre.split(' ')[0].toUpperCase();

  if (!result[categoria]) result[categoria] = [];

  result[categoria].push({
    codigo,
    nombre,
    mayorista: precio
  });
});

// Guardar JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));

// Logs
console.log('\n📦 Productos procesados:', data.length);
console.log('📂 Categorías generadas:', Object.keys(result).length);

if (errors.length) {
  console.log('\n❌ ERRORES:');
  errors.slice(0, 10).forEach(e => console.log(' -', e));
  console.log(`... y ${errors.length - 10} más`);
} else {
  console.log('\n✅ JSON generado correctamente');
}