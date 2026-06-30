using Microsoft.AspNetCore.Mvc;
using movimientos.app.core.Core.Dtos;
using movimientos.app.core.Infrastructure;
using movimientos.app.core.Infrastructure.Interface;

namespace movimientos.app.Controllers
{
    [ApiController]
    [Route("api/categoria")]
    public class CategoriaController : Controller
    {
        private readonly ICategoriaService _categoriaService;

        public CategoriaController(ICategoriaService categoriaService)
        {
            _categoriaService = categoriaService;
        }
        [HttpGet]
        public async Task<IActionResult> GetCategorias()
        {
            var movimientos = await _categoriaService.GetAllCategoriasAsync();
            return Ok(movimientos);
        }
        [HttpGet("GetCategoriaId")]
        public async Task<IActionResult> GetCategoriaId([FromQuery] int categoria)
        {
            var movimientos = await _categoriaService.GetCategoriaByIdAsync(categoria);
            return Ok(movimientos);
        }
        [HttpPost]
        public async Task<IActionResult> AddCategoria([FromBody] CategoriaDTO categoria)
        {
            int result = await _categoriaService.AddCategoriaAsync(categoria);
            return result > 0 ? Ok("Categoria agregado") : BadRequest("Error al agregar");
        }

        [HttpPut]
        public async Task<IActionResult> UpdateCategoria([FromBody] CategoriaDTO categoria)
        {
            int result = await _categoriaService.UpdateCategoriaAsync(categoria);
            return result > 0 ? Ok("Categoria actualizado") : BadRequest("Error al actualizar");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategoria(int id)
        {
            int result = await _categoriaService.DeleteCategoriaAsync(id);
            return result > 0 ? Ok("Categoria eliminado") : BadRequest("Error al eliminar");
        }
        ///////////////////////////////////SUBCATEGORIA//////////////////////////////////////////////
        [HttpGet("getsubcategorias")]
        public async Task<IActionResult> GetSubCategorias()
        {
            var movimientos = await _categoriaService.GetAllCategoriasHijosAsync();
            return Ok(movimientos);
        }
        [HttpGet("getsubcategoriasbyidpadre")]
        public async Task<IActionResult> GetSubCategoriasByIdPadre([FromQuery] int id_padre)
        {
            var movimientos = await _categoriaService.GetAllCategoriasByIdPadre(id_padre);
            return Ok(movimientos);
        }
        [HttpPost("guardarSubCategoria")]
        public async Task<IActionResult> guardarSubCategoria([FromBody] CategoriaDTO categoria)
        {
            int result = await _categoriaService.AddSubCategoriaAsync(categoria);
            return result > 0 ? Ok(result) : BadRequest("Error al agregar");
        }
    }
}
