using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using movimientos.app.core.Core.Dtos;
using movimientos.app.mobile.Models;

namespace movimientos.app.mobile.Services
{
    public class SyncService
    {
        private readonly DatabaseService _dbService;
        private HttpClient _httpClient;

        public SyncService(DatabaseService dbService)
        {
            _dbService = dbService;
            _httpClient = new HttpClient();
        }

        private string GetBaseUrl()
        {
            var url = Preferences.Get("ServerUrl", "");
            if (string.IsNullOrEmpty(url)) return "";
            if (!url.EndsWith("/")) url += "/";
            return url;
        }

        public async Task<bool> SyncDataAsync()
        {
            string baseUrl = GetBaseUrl();
            if (string.IsNullOrEmpty(baseUrl)) return false;

            try
            {
                // 1. Enviar movimientos pendientes al servidor
                var pendingMovimientos = await _dbService.GetPendingSyncMovimientosAsync();
                if (pendingMovimientos.Any())
                {
                    // Convert LocalMovimiento back to MovimientoDTO for the API
                    var dtos = pendingMovimientos.Select(m => new MovimientoDTO
                    {
                        Id = m.Id,
                        Monto = m.Monto,
                        Cantidad = m.Cantidad,
                        Descripcion = m.Descripcion,
                        Fecha = m.Fecha,
                        Tipo = m.Tipo,
                        Id_Categoria = m.Id_Categoria,
                        id_metodopago = m.id_metodopago,
                        Id_subcategoria = m.Id_subcategoria
                    }).ToList();

                    var json = JsonSerializer.Serialize(dtos);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var postResponse = await _httpClient.PostAsync($"{baseUrl}api/movimientos/sync", content);
                    if (!postResponse.IsSuccessStatusCode)
                    {
                        return false; // Falló el envío
                    }
                }

                // 2. Descargar Catálogos
                var catResponse = await _httpClient.GetAsync($"{baseUrl}api/categoria");
                if (catResponse.IsSuccessStatusCode)
                {
                    var categorias = await catResponse.Content.ReadFromJsonAsync<List<CategoriaDTO>>();
                    if (categorias != null)
                    {
                        var localCat = categorias.Select(c => new LocalCategoria { Id = c.Id, Nombre = c.Nombre, id_padre = c.id_padre }).ToList();
                        await _dbService.SaveCategoriasMasivasAsync(localCat);
                    }
                }

                var mpResponse = await _httpClient.GetAsync($"{baseUrl}api/metodospagos");
                if (mpResponse.IsSuccessStatusCode)
                {
                    var metodos = await mpResponse.Content.ReadFromJsonAsync<List<MetodoPagoDto>>();
                    if (metodos != null)
                    {
                        var localMp = metodos.Select(m => new LocalMetodoPago { id = m.id, metodo = m.metodo }).ToList();
                        await _dbService.SaveMetodosPagoMasivosAsync(localMp);
                    }
                }

                // 3. Descargar todos los movimientos del mes actual (o de los últimos meses). 
                // Por simplicidad en offline-first completo, podríamos bajar todos, pero la API usa paginación.
                // Para offline básico: limpiar pendientes que ya se subieron exitosamente.
                // Y dejar que el usuario agregue más.
                
                // Si la política es borrar y descargar TODO, necesitaríamos un endpoint que retorne TODO sin paginación, 
                // o iterar sobre las páginas. Como crearemos el endpoint `sync`, este endpoint de Sync
                // podría devolver los últimos movimientos actualizados.
                // Por ahora, eliminamos los pendientes locales para no duplicarlos, ya que están en la nube.
                foreach (var m in pendingMovimientos)
                {
                    await _dbService.DeleteMovimientoAsync(m);
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error de sincronización: {ex.Message}");
                return false;
            }
        }
    }
}
