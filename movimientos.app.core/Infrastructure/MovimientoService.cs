using movimientos.app.core.Core.Dtos;
using movimientos.app.core.Infrastructure.Interface;

namespace movimientos.app.core.Infrastructure
{
    public class MovimientoService : IMovimientoService
    {
        private readonly IGenericRepository<MovimientoDTO> _repository;
        private readonly IGenericRepository<DataAnualDto> _repositorydataanual;

        public MovimientoService(IGenericRepository<MovimientoDTO> repository, IGenericRepository<DataAnualDto> repositorydataanual)
        {
            _repository = repository;
            _repositorydataanual = repositorydataanual;
        }

        public async Task<IEnumerable<MovimientoDTO>> GetMovimientosByCategoriaAsync(int idCategoria, int mes, int anio, int PageSize, int PageNumber)
        {
            int Offset = (PageNumber - 1) * PageSize;
            string sql = @$"SELECT * FROM Movimientos WHERE id_categoria = @idCategoria AND MONTH(fecha) = @mes AND YEAR(fecha) = @Anio ORDER BY id OFFSET {(PageNumber - 1) * PageSize} ROWS 
        FETCH NEXT {PageSize} ROWS ONLY;";
            return await _repository.GetAllAsync(sql, new { idCategoria, mes, anio });
        }
        public async Task<MovimientoDTO> GetMovimientoById(int id)
        {
            string sql = "SELECT * FROM Movimientos WHERE id = @id";
            var data = await _repository.GetAllAsync(sql, new { id });
            return data.SingleOrDefault();
        }

        public async Task<int> AddMovimientoAsync(MovimientoDTO movimiento)
        {
            string sql = @"INSERT INTO Movimientos (monto, cantidad, descripcion, fecha, tipo, id_categoria, id_metodopago, id_subcategoria) 
                           VALUES (@Monto, @Cantidad, @Descripcion, @Fecha, @Tipo, @Id_Categoria, @id_metodopago, @id_subcategoria)";
            return await _repository.InsertAsync(sql, movimiento);
        }

        public async Task<int> UpdateMovimientoAsync(MovimientoDTO movimiento)
        {
            string sql = @"UPDATE Movimientos SET 
                            monto = @Monto, 
                            cantidad = @Cantidad, 
                            descripcion = @Descripcion, 
                            fecha = @Fecha, 
                            tipo = @Tipo, 
                            id_categoria = @Id_Categoria ,
id_metodopago = @id_metodopago,
id_subcategoria = @id_subcategoria
                          WHERE id = @Id";
            return await _repository.UpdateAsync(sql, movimiento);
        }

        public async Task<int> DeleteMovimientoAsync(int id)
        {
            string sql = "DELETE FROM Movimientos WHERE id = @Id";
            return await _repository.DeleteAsync(sql, new { Id = id });
        }

        // Obtener el total de ingresos filtrado por mes
        public async Task<decimal> GetTotalIngresosAsync(int mes, int anio)
        {
            string sql = "SELECT SUM(monto) AS Monto FROM Movimientos WHERE tipo = 1 AND MONTH(fecha) = @Mes AND YEAR(fecha) = @Anio";
            var parametros = new { Mes = mes, Anio = anio };
            var totalIngresos = await _repository.GetAllAsync(sql, parametros);
            return totalIngresos.FirstOrDefault()?.Monto ?? 0;
        }

        // Obtener el total de egresos filtrado por mes
        public async Task<decimal> GetTotalEgresosAsync(int mes, int anio)
        {
            string sql = "SELECT SUM(monto) AS Monto FROM Movimientos WHERE tipo = 0 AND MONTH(fecha) = @Mes AND YEAR(fecha) = @Anio";
            var parametros = new { Mes = mes, Anio = anio };
            var totalEgresos = await _repository.GetAllAsync(sql, parametros);
            return totalEgresos.FirstOrDefault()?.Monto ?? 0;
        }
        // Obtener el total de egresos virtuales filtrado por mes
        public async Task<decimal> GetTotalEgresosParcialesAsync(int mes, int anio)
        {
            string sql = "SELECT SUM(monto) AS Monto FROM Movimientos WHERE tipo = 2 AND MONTH(fecha) = @Mes AND YEAR(fecha) = @Anio";
            var parametros = new { Mes = mes, Anio = anio };
            var totalEgresos = await _repository.GetAllAsync(sql, parametros);
            return totalEgresos.FirstOrDefault()?.Monto ?? 0;
        }
        public async Task<IEnumerable<MovimientoDTO>> GetMovimientosVituales(int mes, int anio, int PageSize, int PageNumber)
        {
            int Offset = (PageNumber - 1) * PageSize;
            string sql = @$"SELECT * FROM Movimientos WHERE tipo = 2 AND MONTH(fecha) = @mes AND YEAR(fecha) = @anio ORDER BY id;";
            return await _repository.GetAllAsync(sql, new { mes, anio });
        }
        public async Task<decimal> GetTotalIngresosVituales(int mes, int anio)
        {
            string sql = "SELECT SUM(monto) AS Monto FROM Movimientos WHERE tipo = 3 AND MONTH(fecha) = @Mes AND YEAR(fecha) = @Anio";
            var parametros = new { Mes = mes, Anio = anio };
            var totalEgresos = await _repository.GetAllAsync(sql, parametros);
            return totalEgresos.FirstOrDefault()?.Monto ?? 0;
        }
        // Obtener el saldo (ingresos - egresos) filtrado por mes
        public async Task<decimal> GetSaldoAsync(int mes, int anio)
        {
            var ingresos = await GetTotalIngresosAsync(mes, anio);
            var egresos = await GetTotalEgresosAsync(mes, anio);
            return ingresos - egresos;
        }
        // Obtener el saldo (ingresos - egresos) filtrado por mes
        public async Task<decimal> GetSaldoParcialAsync(int mes, int anio)
        {
            var ingresos = await GetTotalIngresosAsync(mes, anio);
            var egresos = await GetTotalEgresosAsync(mes, anio);
            var egresosParciales = await GetTotalEgresosParcialesAsync(mes, anio);
            return (ingresos - egresos) - egresosParciales;
        }
        #region consultas para los reportes mensuales
        public async Task<IEnumerable<DataAnualDto>> ObtenerMovimientosAnualesReales(int anio)
        {
            string sql = @$"SELECT 
    FORMAT(fecha, 'yyyy-MM') AS mes, 
    SUM(CASE WHEN tipo = 1 THEN monto ELSE 0 END) AS ingresos_proyectados,
    SUM(CASE WHEN tipo = 0 THEN monto ELSE 0 END) AS egresos_proyectados,
    SUM(CASE WHEN tipo = 1 THEN monto ELSE -monto END) AS saldo_proyectado
FROM Movimientos
WHERE tipo IN (0, 1) 
AND YEAR(fecha) = @anio
GROUP BY FORMAT(fecha, 'yyyy-MM')
ORDER BY mes;
";
            return await _repositorydataanual.GetAllAsync(sql, new { anio });
        }
        public async Task<IEnumerable<DataAnualDto>> ObtenerMovimientosAnualesVirtuales(int anio)
        {
            string sql = @$"SELECT 
    FORMAT(fecha, 'yyyy-MM') AS mes, 
    SUM(CASE WHEN tipo IN (1, 3) THEN monto ELSE 0 END) AS ingresos_proyectados,
    SUM(CASE WHEN tipo IN (0, 2) THEN monto ELSE 0 END) AS egresos_proyectados,
    SUM(CASE WHEN tipo IN (1, 3) THEN monto ELSE -monto END) AS saldo_proyectado
FROM Movimientos
WHERE YEAR(fecha) = @anio
GROUP BY FORMAT(fecha, 'yyyy-MM')
ORDER BY mes;
";
            return await _repositorydataanual.GetAllAsync(sql, new { anio });
        }
        #endregion

        public async Task<IEnumerable<MovimientoDTO>> GetAllEgresosAsync(int mes, int anio)
        {
            string sql = "SELECT * FROM Movimientos WHERE tipo = 0 AND MONTH(fecha) = @Mes AND YEAR(fecha) = @Anio";
            var parametros = new { Mes = mes, Anio = anio };
            return await _repository.GetAllAsync(sql, parametros);
        }
        public async Task<IEnumerable<MovimientoDTO>> GetAllEgresosPorTipoPagoAsync(int mes, int id_metodopago, int anio)
        {
            string sql = "SELECT * FROM Movimientos WHERE tipo = 0 AND MONTH(fecha) = @Mes AND id_metodopago = @idmetodopago AND YEAR(fecha) = @Anio";
            var parametros = new { Mes = mes, idmetodopago = id_metodopago, Anio=anio };
            return await _repository.GetAllAsync(sql, parametros);
        }
        public async Task<IEnumerable<MovimientoDTO>> GetMovimientosPorSubCategoria(int? mes, int? anio, int? id_categoria, int? id_subcategoria)
        {
            string sql = @"SELECT 
    *
FROM Movimientos M
INNER JOIN Categoria C       ON M.id_categoria = C.id
LEFT  JOIN Categoria CP      ON C.id_padre = CP.id
INNER JOIN MetodoPago MP     ON M.id_metodopago = MP.id
WHERE
    -- Categoría padre (obligatoria)
    (
        C.id = @id_categoria 
        OR C.id_padre = @id_categoria
    )

    -- Subcategoría (OPCIONAL)
    AND (@id_subcategoria IS NULL OR M.id_subcategoria = @id_subcategoria)

    -- Año (obligatorio)
    AND YEAR(M.fecha) = @anio

    -- Mes (opcional)
    AND (@mes IS NULL OR MONTH(M.fecha) = @mes)
ORDER BY M.fecha DESC;";
            var parametros = new { mes = mes, anio = anio, id_categoria = id_categoria, id_subcategoria = id_subcategoria };
            return await _repository.GetAllAsync(sql, parametros);
        }
    }
}
