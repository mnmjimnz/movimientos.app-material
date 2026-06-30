namespace movimientos.app.core.Core.Dtos
{
    public class MovimientoDTO
    {
        public int Id { get; set; }
        public decimal Monto { get; set; }
        public int Cantidad { get; set; }
        public string Descripcion { get; set; }
        public DateTime Fecha { get; set; }
        public int? Tipo { get; set; } // 1 = Ingreso, 0 = Egreso
        public int Id_Categoria { get; set; }
        public CategoriaDTO? categoria { get; set; }
        public int id_metodopago { get; set; }
        public MetodoPagoDto? metodopago { get; set; }
        public int? Id_subcategoria { get; set; }
        public CategoriaDTO? subcategoria { get; set; }
    }
}
