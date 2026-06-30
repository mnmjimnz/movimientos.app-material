CREATE DATABASE FinanzasDB;
GO

USE FinanzasDB;
GO

CREATE TABLE Categoria (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL
);

CREATE TABLE Movimientos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    monto DECIMAL(18,2) NOT NULL,
    cantidad INT NOT NULL,
    descripcion NVARCHAR(255),
    fecha DATE NOT NULL,
    tipo INT NOT NULL,  -- 1 = Ingreso, 0 = Egreso
    id_categoria INT NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id) ON DELETE CASCADE
);


alter table Movimientos
	alter column tipo int not null

	Create table MetodoPago(
id int not null identity(1,1),
metodo nvarchar(100) not null
)
ALTER TABLE MetodoPago
ADD CONSTRAINT PK_MetodoPago PRIMARY KEY (id);
ALTER TABLE Movimientos
ADD id_metodopago INT NULL;

ALTER TABLE Movimientos
ADD CONSTRAINT FK_Movimientos_MetodoPago
FOREIGN KEY (id_metodopago) REFERENCES MetodoPago(id);

ALTER TABLE Categoria 
ADD id_padre INT NULL;

ALTER TABLE Categoria
ADD CONSTRAINT fk_categoria_padre 
    FOREIGN KEY (id_padre) 
    REFERENCES Categoria(id) 
    ON DELETE NO ACTION; -- Cambiado para evitar el ciclo
