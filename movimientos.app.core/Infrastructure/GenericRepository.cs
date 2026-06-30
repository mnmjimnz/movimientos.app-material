using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using movimientos.app.core.Core.Dtos;
using movimientos.app.core.Infrastructure;
using movimientos.app.core.Infrastructure.Interface;
using System.Data;
using System.Data.Common;

namespace movimientos.app.core.Infrastructure
{
    public class GenericRepository<T> : IGenericRepository<T>
    {
        private readonly IDbConnection _dbConnection;
        public GenericRepository(IOptions<ConnectionString> connectionString)
        {
            _dbConnection = new SqlConnection(connectionString.Value.Connection);
        }

        

        public async Task<IEnumerable<T>> GetAllAsync(string sql, object parameters = null)
        {
            try
            {
                _dbConnection?.Open();
                return await _dbConnection.QueryAsync<T>(sql, parameters);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return new List<T>();
            }
            finally
            {
                _dbConnection?.Close();
            }
        }

        public async Task<int> InsertAsync(string sql, object parameters)
        {
            try
            {
                _dbConnection?.Open();
                return await _dbConnection.ExecuteAsync(sql, parameters);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return -1;
            }
            finally
            {
                _dbConnection?.Close();
            }
        }
        public async Task<int> InsertScalarAsync(string sql, object parameters)
        {
            try
            {
                // Nota: Con Dapper no siempre es necesario abrir/cerrar manualmente, 
                // pero si lo haces, asegúrate de que la conexión no sea nula.
                if (_dbConnection.State == ConnectionState.Closed)
                    await ((DbConnection)_dbConnection).OpenAsync();

                // ExecuteScalarAsync devuelve la primera columna de la primera fila
                var result = await _dbConnection.ExecuteScalarAsync(sql, parameters);

                return Convert.ToInt32(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return -1;
            }
            finally
            {
                _dbConnection?.Close();
            }
        }
        public async Task<int> UpdateAsync(string sql, object parameters)
        {
            try
            {
                _dbConnection?.Open();
                return await _dbConnection.ExecuteAsync(sql, parameters);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return -1;
            }
            finally
            {
                _dbConnection?.Close();
            }
        }

        public async Task<int> DeleteAsync(string sql, object parameters)
        {
            try
            {
                _dbConnection?.Open();
                return await _dbConnection.ExecuteAsync(sql, parameters);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return -1;
            }
            finally
            {
                _dbConnection?.Close();
            }
        }
    }
}
