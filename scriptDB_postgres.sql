-- PostgreSQL Migration Script for FinanzasDB

-- Si deseas crear la base de datos desde aquí, descomenta las siguientes líneas:
-- CREATE DATABASE finanzasdb;
-- \c finanzasdb;

CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_padre INT NULL
);

ALTER TABLE categoria
ADD CONSTRAINT fk_categoria_padre 
    FOREIGN KEY (id_padre) 
    REFERENCES categoria(id) 
    ON DELETE NO ACTION;

CREATE TABLE metodopago (
    id SERIAL PRIMARY KEY,
    metodo VARCHAR(100) NOT NULL
);

CREATE TABLE movimientos (
    id SERIAL PRIMARY KEY,
    monto DECIMAL(18,2) NOT NULL,
    cantidad INT NOT NULL,
    descripcion VARCHAR(255),
    fecha DATE NOT NULL,
    tipo INT NOT NULL,  -- 1 = Ingreso, 0 = Egreso
    id_categoria INT NOT NULL,
    id_metodopago INT NULL,
    CONSTRAINT fk_movimientos_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id) ON DELETE CASCADE,
    CONSTRAINT fk_movimientos_metodopago FOREIGN KEY (id_metodopago) REFERENCES metodopago(id)
);
