using movimientos.app.core.Core.Dtos;

namespace movimientos.app.core.Infrastructure.Interface
{
    public interface IMetodoPagoService
    {
        Task<IEnumerable<MetodoPagoDto>> GetAll();
        Task<MetodoPagoDto> GetById(int id);
        Task<int> Add(MetodoPagoDto categoria);
        Task<int> Update(MetodoPagoDto categoria);
        Task<int> Delete(int id);
    }
}
