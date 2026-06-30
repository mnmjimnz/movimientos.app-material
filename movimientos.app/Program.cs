using movimientos.app.core.Core.Dtos;
using movimientos.app.core.Infrastructure;
using movimientos.app.core.Infrastructure.Interface;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.Configure<ConnectionString>(builder.Configuration.GetSection("ConnectionStrings"));
builder.Services.AddTransient<IGenericRepository<MovimientoDTO>, GenericRepository<MovimientoDTO>>();
builder.Services.AddTransient<IGenericRepository<CategoriaDTO>, GenericRepository<CategoriaDTO>>();
builder.Services.AddTransient<IGenericRepository<DataAnualDto>, GenericRepository<DataAnualDto>>();
builder.Services.AddTransient<IGenericRepository<MetodoPagoDto>, GenericRepository<MetodoPagoDto>>();
builder.Services.AddTransient<IMovimientoService, MovimientoService>();
builder.Services.AddTransient<ICategoriaService, CategoriaService>();
builder.Services.AddTransient<IMetodoPagoService, MetodoPagoService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Totales}/{id?}");

app.Run();
