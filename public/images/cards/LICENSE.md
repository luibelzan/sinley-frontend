# Licencia de las imágenes de cartas

Las imágenes de `public/images/cards/` (todas excepto ninguna: son todas
derivadas) provienen de:

**Spanish Playing Cards SVG Collection**
Artwork original de [Basquetteur](https://commons.wikimedia.org/wiki/User:Basquetteur),
disponible en [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Spanish_playing_cards).
Colección SVG: https://github.com/gjenkins20/spanish-playing-cards-svg

## Licencia: CC BY-SA 3.0

https://creativecommons.org/licenses/by-sa/3.0/

## Cambios realizados respecto al original

- Los SVG originales (~1-4 MB cada uno, vectorizados desde escaneos raster)
  se **convirtieron a PNG** a 240×370 px (cada archivo original tenía una
  proporción ligeramente distinta — entre 367 y 370 px de alto — así que se
  forzó el mismo tamaño exacto en las 28 cartas para que ninguna quedara con
  un margen distinto a las demás), sin recompresión con pérdida.
- Solo se usan 7 de los 12 rangos por palo (As, Tres, Cinco, Siete, Sota,
  Caballero, Rey), ya que "Sin Ley" se juega con una baraja de 32 cartas
  (Sota/Caballo/Rey renombrados aquí Sota/Caballero/Rey se corresponden con
  los archivos `_10`, `_11`, `_12` del repositorio original). Para completar
  las 32 cartas se usa una segunda Tres por palo (repitiendo el mismo archivo
  `_03`), en vez de inventar una carta "10" que no existe en ninguna baraja
  española real.

## Atribución

```
Spanish playing card artwork by Basquetteur (Wikimedia Commons)
Adaptado (recortado, convertido a PNG, redimensionado) para "Sin Ley"
Licenciado bajo CC BY-SA 3.0
https://creativecommons.org/licenses/by-sa/3.0/
```

## Nota sobre "compartir igual"

Los archivos PNG derivados en `public/images/cards/` quedan, igual que el
original, bajo licencia CC BY-SA 3.0. Esto afecta únicamente a estos
archivos de imagen — el resto del código de la aplicación (backend,
frontend, lógica del juego) no está obligado a heredar esta licencia.
