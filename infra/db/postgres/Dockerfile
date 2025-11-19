FROM postgres:16

# Copia scripts de inicialización (se ejecutan solo en el primer arranque del volumen)
COPY init/*.sql /docker-entrypoint-initdb.d/