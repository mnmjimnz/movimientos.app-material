using Microsoft.AspNetCore.Mvc;
using movimientos.app.core.Core.Dtos;
using movimientos.app.core.Infrastructure.Interface;

namespace movimientos.app.Controllers
{
    [ApiController]
    [Route("api/metodospagos")]
    public class MetodoPagoController : Controller
    {
        private readonly IMetodoPagoService _metodoPagoService;

        public MetodoPagoController(IMetodoPagoService metodoPagoService)
        {
            _metodoPagoService = metodoPagoService;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var movimientos = await _metodoPagoService.GetAll();
            return Ok(movimientos);
        }
        [HttpGet("GetId")]
        public async Task<IActionResult> GetId([FromQuery] int metodo)
        {
            var movimientos = await _metodoPagoService.GetById(metodo);
            return Ok(movimientos);
        }
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] MetodoPagoDto metodo)
        {
            int result = await _metodoPagoService.Add(metodo);
            return result > 0 ? Ok("Categoria agregado") : BadRequest("Error al agregar");
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] MetodoPagoDto metodo)
        {
            int result = await _metodoPagoService.Update(metodo);
            return result > 0 ? Ok("Categoria actualizado") : BadRequest("Error al actualizar");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            int result = await _metodoPagoService.Delete(id);
            return result > 0 ? Ok("Categoria eliminado") : BadRequest("Error al eliminar");
        }
    }
}
