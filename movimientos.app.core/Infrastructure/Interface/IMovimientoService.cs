using movimientos.app.core.Core.Dtos;

namespace movimientos.app.core.Infrastructure.Interface
{
    public interface IMovimientoService
    {
        Task<IEnumerable<MovimientoDTO>> GetMovimientosByCategoriaAsync(int idCategoria, int mes, int anio, int PageSize, int PageNumber);
        Task<int> AddMovimientoAsync(MovimientoDTO movimiento);
        Task<int> AddMovimientosMasivosAsync(List<MovimientoDTO> movimientos);
        Task<int> UpdateMovimientoAsync(MovimientoDTO movimiento);
        Task<int> DeleteMovimientoAsync(int id);
        Task<MovimientoDTO> GetMovimientoById(int id);
        Task<decimal> GetTotalIngresosAsync(int mes, int anio);
        Task<decimal> GetTotalEgresosAsync(int mes, int anio);
        Task<decimal> GetTotalIngresosVituales(int mes, int anio);
        Task<decimal> GetSaldoAsync(int mes, int anio);
        Task<decimal> GetSaldoParcialAsync(int mes, int anio);
        Task<decimal> GetTotalEgresosParcialesAsync(int mes, int anio);
        Task<IEnumerable<MovimientoDTO>> GetMovimientosVituales(int mes, int anio, int PageSize, int PageNumber);
        Task<IEnumerable<DataAnualDto>> ObtenerMovimientosAnualesReales(int anio);
        Task<IEnumerable<DataAnualDto>> ObtenerMovimientosAnualesVirtuales(int anio);
        Task<IEnumerable<MovimientoDTO>> GetAllEgresosAsync(int mes, int anio);
        Task<IEnumerable<MovimientoDTO>> GetAllEgresosPorTipoPagoAsync(int mes, int id_metodopago, int anio);
        Task<IEnumerable<MovimientoDTO>> GetMovimientosPorSubCategoria(int? mes, int? anio, int? id_categoria, int? id_subcategoria);
    }
}
