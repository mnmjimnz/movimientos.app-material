using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace movimientos.app.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }
        public async Task<IActionResult> Index()
        {
            return View();
        }
        public async Task<IActionResult> Totales()
        {
            return View();
        }
        public async Task<IActionResult> Movimientos(int id, string catname)
        {
            // Aquí puedes usar el id para obtener datos relacionados con la categoría seleccionada
            ViewBag.CategoriaId = id; // Pasar el id de la categoría a la vista si lo necesitas
            ViewBag.NombreCategoria = catname;
            return View();
        }
        public async Task<IActionResult> MovimientosVirtuales()
        {
            return View();
        }
        public async Task<IActionResult> MovimientosAnualesGlobales()
        {
            return View();
        }
        public async Task<IActionResult> MetodoPagos()
        {
            return View();
        }
        public async Task<IActionResult> VerTodosDebitos()
        {
            return View();
        }
        public async Task<IActionResult> VereDebitosPorMetodoPago()
        {
            return View();
        }
        public async Task<IActionResult> VerMovimientosPorSubCategoria()
        {
            return View();
        }
    }
}
