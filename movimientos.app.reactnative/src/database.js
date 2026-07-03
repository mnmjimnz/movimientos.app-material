import * as SQLite from 'expo-sqlite';

let dbPromise = null;

const getDb = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('finanzasLocal.db');
  }
  return await dbPromise;
};

export const initDb = async () => {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS Movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monto REAL NOT NULL,
      cantidad INTEGER NOT NULL,
      descripcion TEXT NOT NULL,
      fecha TEXT NOT NULL,
      tipo INTEGER NOT NULL,
      id_categoria INTEGER NOT NULL,
      id_metodopago INTEGER NOT NULL,
      isSyncPending INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS Categorias (
      id INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL,
      id_padre INTEGER
    );
    CREATE TABLE IF NOT EXISTS MetodosPago (
      id INTEGER PRIMARY KEY,
      metodo TEXT NOT NULL
    );
  `);
};

export const addMovimiento = async (movimiento) => {
  const db = await getDb();
  const statement = await db.prepareAsync(
    `INSERT INTO Movimientos (monto, cantidad, descripcion, fecha, tipo, id_categoria, id_metodopago, isSyncPending) 
     VALUES ($monto, $cantidad, $descripcion, $fecha, $tipo, $id_categoria, $id_metodopago, 1)`
  );
  try {
    let result = await statement.executeAsync({
      $monto: movimiento.monto,
      $cantidad: movimiento.cantidad,
      $descripcion: movimiento.descripcion,
      $fecha: movimiento.fecha,
      $tipo: movimiento.tipo,
      $id_categoria: movimiento.id_categoria,
      $id_metodopago: movimiento.id_metodopago
    });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

export const getPendingMovimientos = async () => {
  const db = await getDb();
  const allRows = await db.getAllAsync('SELECT * FROM Movimientos WHERE isSyncPending = 1');
  return allRows;
};

export const deleteAllPendingMovimientos = async () => {
  const db = await getDb();
  await db.runAsync('DELETE FROM Movimientos WHERE isSyncPending = 1');
};

export const getPendingCount = async () => {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM Movimientos WHERE isSyncPending = 1');
  return row ? row.count : 0;
};
