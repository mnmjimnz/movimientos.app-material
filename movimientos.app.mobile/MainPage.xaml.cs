using movimientos.app.mobile.Models;
using movimientos.app.mobile.Services;

namespace movimientos.app.mobile
{
    public partial class MainPage : ContentPage
    {
        private readonly DatabaseService _dbService;
        private readonly SyncService _syncService;

        public MainPage()
        {
            InitializeComponent();
            _dbService = new DatabaseService();
            _syncService = new SyncService(_dbService);
            
            UrlEntry.Text = Preferences.Get("ServerUrl", "");
            RefreshPendingCount();
        }

        private void OnSaveUrlClicked(object sender, EventArgs e)
        {
            Preferences.Set("ServerUrl", UrlEntry.Text);
            DisplayAlert("Guardado", "URL del servidor guardada exitosamente.", "OK");
        }

        private async void OnSyncClicked(object sender, EventArgs e)
        {
            SyncBtn.IsEnabled = false;
            SyncBtn.Text = "Sincronizando...";

            bool success = await _syncService.SyncDataAsync();
            if (success)
            {
                await DisplayAlert("Éxito", "Sincronización completada. Los movimientos se han subido y la caché local se ha limpiado.", "OK");
            }
            else
            {
                await DisplayAlert("Error", "No se pudo sincronizar. Verifica tu conexión o la URL del servidor.", "OK");
            }

            SyncBtn.IsEnabled = true;
            SyncBtn.Text = "Sincronizar Ahora";
            RefreshPendingCount();
        }

        private async void OnAddMovimientoClicked(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(DescEntry.Text) || string.IsNullOrEmpty(MontoEntry.Text))
            {
                await DisplayAlert("Error", "Llena todos los campos", "OK");
                return;
            }

            var mov = new LocalMovimiento
            {
                Descripcion = DescEntry.Text,
                Monto = decimal.Parse(MontoEntry.Text),
                Cantidad = 1,
                Fecha = DateTime.Now,
                Tipo = TipoPicker.SelectedIndex == 1 ? 1 : 0, // 1 Ingreso, 0 Egreso
                Id_Categoria = 1, // Default por simplificación offline, requeriría selector real
                id_metodopago = 1, // Default
                IsSyncPending = true
            };

            await _dbService.SaveMovimientoAsync(mov);

            DescEntry.Text = "";
            MontoEntry.Text = "";
            
            await DisplayAlert("Guardado", "Movimiento guardado localmente (Offline)", "OK");
            RefreshPendingCount();
        }

        private async void RefreshPendingCount()
        {
            var pendings = await _dbService.GetPendingSyncMovimientosAsync();
            PendingCountLabel.Text = $"Movimientos pendientes: {pendings.Count}";
        }
    }
}
