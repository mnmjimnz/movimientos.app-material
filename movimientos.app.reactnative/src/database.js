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
      id_server INTEGER,
      monto REAL NOT NULL,
      cantidad INTEGER NOT NULL,
      descripcion TEXT NOT NULL,
      fecha TEXT NOT NULL,
      tipo INTEGER NOT NULL,
      id_categoria INTEGER NOT NULL,
      id_subcategoria INTEGER,
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

// ----------------- Movimientos -----------------

export const addMovimiento = async (movimiento) => {
  const db = await getDb();
  const statement = await db.prepareAsync(
    `INSERT INTO Movimientos (id_server, monto, cantidad, descripcion, fecha, tipo, id_categoria, id_subcategoria, id_metodopago, isSyncPending) 
     VALUES ($id_server, $monto, $cantidad, $descripcion, $fecha, $tipo, $id_categoria, $id_subcategoria, $id_metodopago, $isSyncPending)`
  );
  try {
    let result = await statement.executeAsync({
      $id_server: movimiento.id_server || null,
      $monto: movimiento.monto,
      $cantidad: movimiento.cantidad,
      $descripcion: movimiento.descripcion,
      $fecha: movimiento.fecha,
      $tipo: movimiento.tipo,
      $id_categoria: movimiento.id_categoria,
      $id_subcategoria: movimiento.id_subcategoria || null,
      $id_metodopago: movimiento.id_metodopago,
      $isSyncPending: movimiento.isSyncPending !== undefined ? movimiento.isSyncPending : 1
    });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

export const getPendingMovimientos = async () => {
  const db = await getDb();
  return await db.getAllAsync('SELECT * FROM Movimientos WHERE isSyncPending = 1');
};

export const getAllMovimientos = async () => {
  const db = await getDb();
  return await db.getAllAsync('SELECT * FROM Movimientos ORDER BY fecha DESC');
};

export const deleteAllPendingMovimientos = async () => {
  const db = await getDb();
  await db.runAsync('DELETE FROM Movimientos WHERE isSyncPending = 1');
};

export const deleteAllServerMovimientos = async () => {
  const db = await getDb();
  await db.runAsync('DELETE FROM Movimientos WHERE isSyncPending = 0');
};

export const getPendingCount = async () => {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM Movimientos WHERE isSyncPending = 1');
  return row ? row.count : 0;
};

// ----------------- Catálogos -----------------

export const saveCategorias = async (categorias) => {
  const db = await getDb();
  await db.runAsync('DELETE FROM Categorias');
  for (const c of categorias) {
    const idPadre = c.id_padre !== undefined ? c.id_padre : (c.Id_padre !== undefined ? c.Id_padre : null);
    const catId = c.id !== undefined ? c.id : c.Id;
    const catNombre = c.nombre !== undefined ? c.nombre : c.Nombre;
    await db.runAsync('INSERT INTO Categorias (id, nombre, id_padre) VALUES (?, ?, ?)', [catId, catNombre, idPadre]);
  }
};

export const saveMetodosPago = async (metodos) => {
  const db = await getDb();
  await db.runAsync('DELETE FROM MetodosPago');
  for (const m of metodos) {
    const metId = m.id !== undefined ? m.id : m.Id;
    const metNombre = m.metodo !== undefined ? m.metodo : (m.Metodo !== undefined ? m.Metodo : m.Nombre);
    await db.runAsync('INSERT INTO MetodosPago (id, metodo) VALUES (?, ?)', [metId, metNombre]);
  }
};

export const getCategorias = async () => {
  const db = await getDb();
  return await db.getAllAsync('SELECT * FROM Categorias WHERE id_padre IS NULL OR id_padre = 0');
};

export const getSubcategorias = async (idPadre) => {
  const db = await getDb();
  return await db.getAllAsync('SELECT * FROM Categorias WHERE id_padre = ?', [idPadre]);
};

export const getMetodosPago = async () => {
  const db = await getDb();
  return await db.getAllAsync('SELECT * FROM MetodosPago');
};
