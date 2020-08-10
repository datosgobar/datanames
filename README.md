# Nombres Argentinos

Proyecto de visualización de estadísticas sobre nombres de nacimientos argentinos de 1922 a 2015.

<!-- NO MODIFICAR NI INDICE NI TITULOS -->
## Índice

- [Nombres Argentinos](#nombres-argentinos)
  - [Índice](#índice)
  - [Instalación](#instalación)
    - [Dependencias](#dependencias)
      - [Generación de data](#generación-de-data)
        - [Nota sobre los datos](#nota-sobre-los-datos)
      - [Iniciar el servidor en development](#iniciar-el-servidor-en-development)
  - [Créditos](#créditos)
  - [Contacto](#contacto)

## Instalación

### Dependencias

* Ruby (> 2.2)
  * bundler
  * ruby-dev
* Python
  * pip
  * pandas
* mysql (> 5.7)
  * libmysqlclient-dev

#### Generación de data

1. Clonar el repositorio.
2. Copiar el archivo sample de configuración de mysql: `cp config/mysql.conf.sample config/mysql.conf`
3. Editar `config/mysql.conf` con los valores correspondientes.
4. Instalar `pandas` y sus dependencias: `pip install pandas`. _NOTA: Ser pacientes, la instalación de pandas lleva un buen tiempo_
5. Cambiar el path del archivo csv con la data de nombres por el correpondiente en `process_names.py`.
6. Crear la base de datos `nombres` en mysql.
7. Correr `process_names.py`: `cd scripts; python process_names.py`
8. Verificar que los jsons de años (y décadas) fueron generados en `public/years/`.
9. Verificar que los datos de años fueron generados en la base de datos de `nombres`.

##### Nota sobre los datos

En `data/` pueden encontrar:
- Una muestra de los datos usados para el proyecto de nombres argentinos.
  - _La muestra no contiene la columna de género, ya que la misma fue agregada posteriormente y calculada predictivamente_

#### Iniciar el servidor en development

1. Copiar el archivo sample de configuración de la app: `cp config/app_config.yml.sample config/app_config.yml`
2. Instalar las gemas necesarias: `bundle install`.
3. Iniciar el servidor en el puerto 9393: `shotgun -p 9393`
  - El servidor puede correrse tanto con `webrick` (`shotgun -p 9393 -s webrick`) como con `thin` (`shotgun -p 9393 -s thin`). 
4. Ir a `127.0.0.1:9393/` y confirmar que la web está corriendo correctamente.

## Créditos

Este proyecto estuvo inspirado en el proyecto de [DATA Uruguay](http://data.180.com.uy/) hecho con los nombres de nacimiento de Montevideo. Agradecemos su ayuda, colaboración y código abierto :)

## Contacto

Te invitamos a [crearnos un issue](https://github.com/datosgobar/nombres-argentinos/issues/new) en caso de que encuentres algún bug o tengas feedback de alguna parte de `nombres-argentinos`.

Para todo lo demás, podés mandarnos tu comentario o consulta a [datosargentina@jefatura.gob.ar](mailto:datosargentina@jefatura.gob.ar).
