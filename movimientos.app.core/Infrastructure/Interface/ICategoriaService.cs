using movimientos.app.core.Core.Dtos;

namespace movimientos.app.core.Infrastructure.Interface
{
    public interface ICategoriaService
    {
        Task<IEnumerable<CategoriaDTO>> GetAllCategoriasAsync();
        Task<CategoriaDTO> GetCategoriaByIdAsync(int id);
        Task<int> AddCategoriaAsync(CategoriaDTO categoria);
        Task<int> UpdateCategoriaAsync(CategoriaDTO categoria);
        Task<int> DeleteCategoriaAsync(int id);
        Task<IEnumerable<CategoriaDTO>> GetAllCategoriasHijosAsync();
        Task<int> AddSubCategoriaAsync(CategoriaDTO categoria);
        Task<IEnumerable<CategoriaDTO>> GetAllCategoriasByIdPadre(int id_padre);
    }
}
