# =========================
# Runtime
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 442


# =========================
# Build
# =========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copiamos los csproj (cache eficiente)
COPY ["movimientos.app/movimientos.app.csproj", "movimientos.app/"]
COPY ["movimientos.app.core/movimientos.app.core.csproj", "movimientos.app.core/"]

# Restore
RUN dotnet restore "movimientos.app/movimientos.app.csproj"

# Copiamos todo el código
COPY . .

# Build
WORKDIR "/src/movimientos.app"
RUN dotnet build "movimientos.app.csproj" -c $BUILD_CONFIGURATION -o /app/build


# =========================
# Publish
# =========================
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
WORKDIR /src/movimientos.app
RUN dotnet publish "movimientos.app.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false


# =========================
# Final
# =========================
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "movimientos.app.dll"]
