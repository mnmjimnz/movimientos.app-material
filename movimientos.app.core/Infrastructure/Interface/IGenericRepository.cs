namespace movimientos.app.core.Infrastructure.Interface
{
    public interface IGenericRepository<T>
    {
        Task<IEnumerable<T>> GetAllAsync(string sql, object parameters = null);
        Task<int> InsertAsync(string sql, object parameters);
        Task<int> UpdateAsync(string sql, object parameters);
        Task<int> DeleteAsync(string sql, object parameters);
        Task<int> InsertScalarAsync(string sql, object parameters);
    }
}
