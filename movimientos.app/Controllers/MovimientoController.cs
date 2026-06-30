using Microsoft.AspNetCore.Mvc;
using movimientos.app.core.Core.Dtos;
using movimientos.app.core.Infrastructure;
using movimientos.app.core.Infrastructure.Interface;

namespace movimientos.app.Controllers
{
    [ApiController]
    [Route("api/movimientos")]
    public class MovimientoController : ControllerBase
    {
        private readonly IMovimientoService _movimientoService;
        private readonly ICategoriaService _categoriaService;
        private readonly IMetodoPagoService _metodoPagoService;

        public MovimientoController(IMovimientoService movimientoService, ICategoriaService categoriaService, IMetodoPagoService metodoPagoService)
        {
            _movimientoService = movimientoService;
            _categoriaService = categoriaService;
            _metodoPagoService = metodoPagoService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMovimientos([FromQuery] int categoria, [FromQuery] int mes, [FromQuery]int anio, int PageSize, int PageNumber)
        {
            var movimientos = await _movimientoService.GetMovimientosByCategoriaAsync(categoria, mes, anio, PageSize, PageNumber);
            foreach (var item in movimientos)
            {
                item.metodopago = await _metodoPagoService.GetById(item.id_metodopago);
                item.categoria = await _categoriaService.GetCategoriaByIdAsync((int)item?.Id_Categoria);
                item.subcategoria = item?.Id_subcategoria != null ? await _categoriaService.GetCategoriaByIdAsync((int)item?.Id_subcategoria) : new CategoriaDTO();
            }
            return Ok(movimientos);
        }
        [HttpGet("GetMovimientoId")]
        public async Task<IActionResult> GetMovimientoId([FromQuery] int categoria)
        {
            var movimientos = await _movimientoService.GetMovimientoById(categoria);
            movimientos.metodopago = await _metodoPagoService.GetById(movimientos.id_metodopago);

            return Ok(movimientos);
        }

        [HttpPost]
        public async Task<IActionResult> AddMovimiento([FromBody] MovimientoDTO movimiento)
        {
            int result = await _movimientoService.AddMovimientoAsync(movimiento);
            return result > 0 ? Ok("Movimiento agregado") : BadRequest("Error al agregar");
        }

        [HttpPut]
        public async Task<IActionResult> UpdateMovimiento([FromBody] MovimientoDTO movimiento)
        {
            int result = await _movimientoService.UpdateMovimientoAsync(movimiento);
            return result > 0 ? Ok("Movimiento actualizado") : BadRequest("Error al actualizar");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMovimiento(int id)
        {
            int result = await _movimientoService.DeleteMovimientoAsync(id);
            return result > 0 ? Ok("Movimiento eliminado") : BadRequest("Error al eliminar");
        }
        [HttpGet("totales")]
        public async Task<IActionResult> GetTotales(int mes, int anio)
        {
            if (mes < 1 || mes > 12)
            {
                return BadRequest("El mes debe ser un valor entre 1 y 12.");
            }

            var totalIngresos = await _movimientoService.GetTotalIngresosAsync(mes, anio);
            var totalEgresos = await _movimientoService.GetTotalEgresosAsync(mes, anio);
            var saldo = await _movimientoService.GetSaldoAsync(mes, anio);
            var totalEgresoVirtual = await _movimientoService.GetTotalEgresosParcialesAsync(mes, anio);
            var totalIngresoVirtual = await _movimientoService.GetTotalIngresosVituales(mes, anio);
            var saldoVirtual = saldo - totalEgresoVirtual + totalIngresoVirtual;
            var resultado = new
            {
                TotalIngresos = totalIngresos,
                TotalEgresos = totalEgresos,
                Saldo = saldo,
                TotalEgresoVirtual = totalEgresoVirtual,
                SaldoParcial = saldoVirtual,
                TotalIngresoVirtual = totalIngresoVirtual
            };

            return Ok(resultado);
        }
        [HttpGet("movimientosvirtuales")]
        public async Task<IActionResult> GetMovimientosVirtuales([FromQuery] int mes, [FromQuery]int anio, int PageSize, int PageNumber)
        {
            var movimientos = await _movimientoService.GetMovimientosVituales(mes, anio, PageSize, PageNumber);
            foreach (var item in movimientos)
            {
                item.categoria = await _categoriaService.GetCategoriaByIdAsync(item.Id_Categoria);
                item.metodopago = await _metodoPagoService.GetById(item.id_metodopago);
                item.subcategoria = item?.Id_subcategoria != null ? await _categoriaService.GetCategoriaByIdAsync((int)item?.Id_subcategoria) : new CategoriaDTO();
            }
            return Ok(movimientos);
        }
        [HttpGet("movimientosvirtualesanuales")]
        public async Task<IActionResult> GetMovimientosVirtualesAnuales([FromQuery] int anio)
        {
            var movimientosanualesconfirmados = await _movimientoService.ObtenerMovimientosAnualesReales(anio);
            var movimientosanualesvirtuales = await _movimientoService.ObtenerMovimientosAnualesVirtuales(anio);
            return Ok(new
            {
                confirmados = movimientosanualesconfirmados,
                virtuales = movimientosanualesvirtuales
            });
        }
        [HttpGet("todoslosegresos")]
        public async Task<IActionResult> GetAllDebitos([FromQuery] int mes, [FromQuery] int anio)
        {
            var m = await _movimientoService.GetAllEgresosAsync(mes, anio);
            foreach (var item in m)
            {
                item.metodopago = await _metodoPagoService.GetById(item.id_metodopago);
                item.categoria = await _categoriaService.GetCategoriaByIdAsync(item.Id_Categoria);
                item.subcategoria = item?.Id_subcategoria != null ? await _categoriaService.GetCategoriaByIdAsync((int)item?.Id_subcategoria) : new CategoriaDTO();
            }
            return Ok(m);
        }
        [HttpGet("egresoportipopago")]
        public async Task<IActionResult> GetAllEgresosPorTipoPagoYMes([FromQuery] int mes, [FromQuery] int tipopago, [FromQuery]int anio)
        {
            var m = await _movimientoService.GetAllEgresosPorTipoPagoAsync(mes, tipopago, anio);
            foreach (var item in m)
            {
                item.metodopago = await _metodoPagoService.GetById(item.id_metodopago);
                item.categoria = await _categoriaService.GetCategoriaByIdAsync(item.Id_Categoria);
                item.subcategoria = item?.Id_subcategoria != null ? await _categoriaService.GetCategoriaByIdAsync((int)item?.Id_subcategoria) : new CategoriaDTO();
            }
            return Ok(m);
        }
        [HttpGet("obtenerMovimientosPorSubCategoria")]
        public async Task<IActionResult> GetAllMovimientosPorSubCategoria([FromQuery] int? mes, [FromQuery] int? anio, [FromQuery] int? id_categoria, [FromQuery] int? id_subcategoria)
        {
            var m = await _movimientoService.GetMovimientosPorSubCategoria(mes, anio, id_categoria, id_subcategoria);
            foreach (var item in m)
            {
                item.metodopago = await _metodoPagoService.GetById(item.id_metodopago);
                item.categoria = await _categoriaService.GetCategoriaByIdAsync(item.Id_Categoria);
                item.subcategoria = item?.Id_subcategoria != null ? await _categoriaService.GetCategoriaByIdAsync((int)item?.Id_subcategoria) : new CategoriaDTO();
            }
            return Ok(m);
        }
    }
}
