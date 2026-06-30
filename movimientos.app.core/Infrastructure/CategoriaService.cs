using movimientos.app.core.Core.Dtos;
using movimientos.app.core.Infrastructure.Interface;

namespace movimientos.app.core.Infrastructure
{
    public class CategoriaService : ICategoriaService
    {
        private readonly IGenericRepository<CategoriaDTO> _repository;

        public CategoriaService(IGenericRepository<CategoriaDTO> repository)
        {
            _repository = repository;
        }

        // Obtener todas las categorías
        public async Task<IEnumerable<CategoriaDTO>> GetAllCategoriasAsync()
        {
            string sql = "SELECT * FROM Categoria WHERE id_padre IS NULL;";
            return await _repository.GetAllAsync(sql);
        }
        public async Task<IEnumerable<CategoriaDTO>> GetAllCategoriasHijosAsync()
        {
            string sql = "SELECT * FROM Categoria WHERE id_padre IS NOT NULL";
            return await _repository.GetAllAsync(sql);
        }
        public async Task<IEnumerable<CategoriaDTO>> GetAllCategoriasByIdPadre(int id_padre)
        {
            string sql = $"SELECT * FROM Categoria WHERE id_padre = {id_padre}";
            return await _repository.GetAllAsync(sql, id_padre);
        }
        // Obtener una categoría por su ID
        public async Task<CategoriaDTO> GetCategoriaByIdAsync(int id)
        {
            string sql = $"SELECT * FROM Categoria WHERE id = {id}";
            var data = await _repository.GetAllAsync(sql, id);
            return data.SingleOrDefault()!;
        }

        // Agregar una nueva categoría
        public async Task<int> AddCategoriaAsync(CategoriaDTO categoria)
        {
            string sql = @"INSERT INTO Categoria (nombre,id_padre) 
                       VALUES (@Nombre,@id_padre)";
            return await _repository.InsertAsync(sql, categoria);
        }

        // Actualizar una categoría existente
        public async Task<int> UpdateCategoriaAsync(CategoriaDTO categoria)
        {
            string sql = @"UPDATE Categoria SET 
                        nombre = @Nombre,id_padre = @id_padre
                       WHERE id = @Id";
            return await _repository.UpdateAsync(sql, categoria);
        }

        // Eliminar una categoría
        public async Task<int> DeleteCategoriaAsync(int id)
        {
            string sql = "DELETE FROM Categoria WHERE id = @Id";
            return await _repository.DeleteAsync(sql, new { Id = id });
        }
        //Insertar subcategoria
        public async Task<int> AddSubCategoriaAsync(CategoriaDTO categoria)
        {
            string sql = @"INSERT INTO Categoria (nombre,id_padre) 
                       VALUES (@Nombre,@id_padre) SELECT SCOPE_IDENTITY();";
            return await _repository.InsertScalarAsync(sql, categoria);
        }
    }
}
