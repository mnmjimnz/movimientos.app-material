using SQLite;
using movimientos.app.mobile.Models;

namespace movimientos.app.mobile.Services
{
    public class DatabaseService
    {
        private SQLiteAsyncConnection _db;

        public DatabaseService()
        {
        }

        async Task Init()
        {
            if (_db is not null)
                return;

            string dbPath = Path.Combine(FileSystem.AppDataDirectory, "FinanzasLocal.db3");
            _db = new SQLiteAsyncConnection(dbPath);
            await _db.CreateTableAsync<LocalMovimiento>();
            await _db.CreateTableAsync<LocalCategoria>();
            await _db.CreateTableAsync<LocalMetodoPago>();
        }

        // ==========================
        // MOVIMIENTOS
        // ==========================
        public async Task<List<LocalMovimiento>> GetMovimientosAsync()
        {
            await Init();
            return await _db.Table<LocalMovimiento>().ToListAsync();
        }

        public async Task<List<LocalMovimiento>> GetPendingSyncMovimientosAsync()
        {
            await Init();
            return await _db.Table<LocalMovimiento>().Where(m => m.IsSyncPending).ToListAsync();
        }

        public async Task<int> SaveMovimientoAsync(LocalMovimiento movimiento)
        {
            await Init();
            if (movimiento.LocalId != 0)
                return await _db.UpdateAsync(movimiento);
            else
                return await _db.InsertAsync(movimiento);
        }

        public async Task DeleteAllMovimientosAsync()
        {
            await Init();
            await _db.DeleteAllAsync<LocalMovimiento>();
        }

        public async Task DeleteMovimientoAsync(LocalMovimiento movimiento)
        {
            await Init();
            await _db.DeleteAsync(movimiento);
        }

        // ==========================
        // CATEGORIAS
        // ==========================
        public async Task<List<LocalCategoria>> GetCategoriasAsync()
        {
            await Init();
            return await _db.Table<LocalCategoria>().ToListAsync();
        }

        public async Task SaveCategoriasMasivasAsync(List<LocalCategoria> categorias)
        {
            await Init();
            await _db.DeleteAllAsync<LocalCategoria>();
            await _db.InsertAllAsync(categorias);
        }

        // ==========================
        // METODOS DE PAGO
        // ==========================
        public async Task<List<LocalMetodoPago>> GetMetodosPagoAsync()
        {
            await Init();
            return await _db.Table<LocalMetodoPago>().ToListAsync();
        }

        public async Task SaveMetodosPagoMasivosAsync(List<LocalMetodoPago> metodos)
        {
            await Init();
            await _db.DeleteAllAsync<LocalMetodoPago>();
            await _db.InsertAllAsync(metodos);
        }
    }
}
