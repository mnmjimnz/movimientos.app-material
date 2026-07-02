using SQLite;
using movimientos.app.core.Core.Dtos;

namespace movimientos.app.mobile.Models
{
    [Table("Categorias")]
    public class LocalCategoria : CategoriaDTO
    {
        [PrimaryKey]
        public new int Id { get => base.Id; set => base.Id = value; }
    }
}
