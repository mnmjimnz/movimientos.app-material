using movimientos.app.core.Core.Dtos;
using movimientos.app.core.Infrastructure.Interface;

namespace movimientos.app.core.Infrastructure
{
    public class MetodoPagoService : IMetodoPagoService
    {
        private readonly IGenericRepository<MetodoPagoDto> _repository;
        public MetodoPagoService(IGenericRepository<MetodoPagoDto> repository)
        {
            _repository = repository;
        }
        public async Task<IEnumerable<MetodoPagoDto>> GetAll()
        {
            string sql = "SELECT * FROM MetodoPago";
            return await _repository.GetAllAsync(sql);
        }

        // Obtener una categoría por su ID
        public async Task<MetodoPagoDto> GetById(int id)
        {
            string sql = $"SELECT * FROM MetodoPago WHERE id = {id}";
            var data = await _repository.GetAllAsync(sql, id);
            return data.SingleOrDefault();
        }

        // Agregar una nueva categoría
        public async Task<int> Add(MetodoPagoDto categoria)
        {
            string sql = @"INSERT INTO MetodoPago (metodo) 
                       VALUES (@metodo)";
            return await _repository.InsertAsync(sql, categoria);
        }

        // Actualizar una categoría existente
        public async Task<int> Update(MetodoPagoDto categoria)
        {
            string sql = @"UPDATE MetodoPago SET 
                        metodo = @metodo
                       WHERE id = @id";
            return await _repository.UpdateAsync(sql, categoria);
        }

        // Eliminar una categoría
        public async Task<int> Delete(int id)
        {
            string sql = "DELETE FROM MetodoPago WHERE id = @id";
            return await _repository.DeleteAsync(sql, new { Id = id });
        }
    }
}
