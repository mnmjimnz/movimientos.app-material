using SQLite;
using movimientos.app.core.Core.Dtos;

namespace movimientos.app.mobile.Models
{
    [Table("MetodosPago")]
    public class LocalMetodoPago : MetodoPagoDto
    {
        [PrimaryKey]
        public new int id { get => base.id; set => base.id = value; }
    }
}
