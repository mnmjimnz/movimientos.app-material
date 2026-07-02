using SQLite;
using movimientos.app.core.Core.Dtos;

namespace movimientos.app.mobile.Models
{
    [Table("Movimientos")]
    public class LocalMovimiento : MovimientoDTO
    {
        [PrimaryKey, AutoIncrement]
        public int LocalId { get; set; }
        
        public bool IsSyncPending { get; set; }

        [Ignore]
        public new CategoriaDTO? categoria { get => base.categoria; set => base.categoria = value; }

        [Ignore]
        public new MetodoPagoDto? metodopago { get => base.metodopago; set => base.metodopago = value; }

        [Ignore]
        public new CategoriaDTO? subcategoria { get => base.subcategoria; set => base.subcategoria = value; }
    }
}
