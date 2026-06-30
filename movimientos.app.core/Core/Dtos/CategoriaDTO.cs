namespace movimientos.app.core.Core.Dtos
{
    public class CategoriaDTO
    {
        public int Id { get; set; }
        public string? Nombre { get; set; }
        public int? id_padre { get; set; }
    }
}
