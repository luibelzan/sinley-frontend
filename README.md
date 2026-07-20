# Card game frontend

React + TypeScript + Vite. Sin librería de estilos externa: los tokens de
diseño (colores, tipografía) viven en `src/index.css` como variables CSS.

## Pasos completados
- Paso 6: login / registro / sesión persistente / saldo del wallet
- Paso 7: mesa de juego en tiempo real (WebSockets)

## Paso 7: la mesa de juego

- **`TablePage`** (`src/pages/TablePage.tsx`) — se conecta por Socket.io usando
  el access token de la sesión. Para jugar, primero eliges **partida pública
  o privada**:
  - **Pública**: eliges número de jugadores (2/3/4) e importe de la mesa (1 a
    250€) y pulsas "Buscar mesa": el servidor te sienta en una mesa abierta
    con esa configuración exacta, o crea una nueva.
  - **Privada**: para jugar con amigos. "Crear sala" genera un código de 6
    caracteres que compartes con ellos (aparece en la barra superior de la
    mesa, con un botón para copiarlo); "Unirse con código" te sienta
    directamente en la sala de un amigo con el importe que él haya fijado.

  Todos los jugadores de una misma mesa se sientan con el mismo importe —
  es lo que hace que la partida sea justa. Renderiza en tiempo real: asientos con
  nombre de usuario, stack de fichas actual y estado (retirado/conectado),
  el bote, de quién es el turno, tus propias cartas, los controles de
  apuesta cuando te toca (incluido un botón de **All-in**), el panel de
  descarte, un botón de **recompra de fichas** si te quedas a 0, y el
  resultado final de la mano con el desglose de puntuación de cada jugador.
  Tras cada mano hay una pausa de unos segundos (para ver el resultado y las
  cartas del rival si hubo showdown) y la siguiente mano arranca sola, sin
  pulsar nada — hasta que ya no quede más de un jugador con fichas, momento
  en el que se muestra una pantalla de resultados finales con la posición y
  la ganancia o pérdida neta de cada jugador (estilo torneo).
- **`src/game/types.ts`** — tipos del motor reflejados en el cliente (fases,
  acciones, evaluación de manos, tramos de sala) para tipar los mensajes de
  socket.
- **`PlayingCard` / `CardBack`** (`src/components/`) — cartas propias (con el
  aviso "comodín" en el Cinco) y el reverso para las cartas de los rivales
  (nunca se muestran sus valores mientras la mano está en curso; se revelan
  al terminar por showdown, tal como ya garantizaba el backend).

Los importes de apuesta se introducen en euros (igual que la recarga) y se
convierten a céntimos antes de enviarlos por el socket — el backend siempre
trabaja internamente en céntimos.

## Identidad visual

Estética western/forajido, a partir del logo y fondo proporcionados
(`public/images/icon.png` y `public/images/background.png`): maderas oscuras,
latón envejecido, pergamino. Tipografía **Rye** (western display, del logo)
para titulares + IBM Plex Sans (cuerpo) + IBM Plex Mono (números). El logo
sustituye al wordmark de texto en la pantalla de login/registro y aparece en
pequeño en la barra superior de la mesa; el fondo se aplica a toda la app con
una capa oscura encima para que el texto siga siendo legible.

## Cartas

Las imágenes de `public/images/cards/` son una baraja española real, con
licencia CC BY-SA 3.0 (obra de Basquetteur / Wikimedia Commons). Los SVG
originales pesaban ~1-4 MB cada uno (vectorizados desde escaneos); se
convirtieron a PNG manteniendo su proporción real (240 px de ancho, altura
proporcional), sin recompresión con pérdida, quedando en ~1,7 MB en total
para las 28 cartas + el reverso. Todos los detalles de la
licencia, la atribución exacta y qué se modificó están en
`public/images/cards/LICENSE.md` — **léelo antes de publicar la app**, ya que
la licencia exige mantener esa atribución visible (hay un aviso discreto en
el pie de la pantalla de login) y redistribuir estos PNG concretos bajo la
misma licencia si compartes el proyecto.

El "10" (Diez) que usábamos antes no existía en ninguna baraja española real
(el mazo tradicional salta del 7 a la Sota), así que se quitó: la baraja
vuelve a ser la real de 28 cartas (7 rangos × 4 palos, todas con arte con
licencia, sin excepciones ni duplicados). El problema que motivó añadir esa
carta — que el mazo se quedaba corto si los 4 jugadores descartaban el
máximo — se resuelve ahora en el propio motor: si hace falta, se barajan de
nuevo las cartas ya descartadas en esa fase y se sigue repartiendo desde ahí.

## Cómo levantarlo

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar el archivo de entorno (ajusta la URL si el backend no está en el
   puerto 4000):
   ```bash
   cp .env.example .env
   ```
3. Con el backend corriendo (`npm run dev` en `../backend`), arrancar el frontend:
   ```bash
   npm run dev
   ```
4. Abrir `http://localhost:5173` **en dos pestañas o navegadores distintos**
   (o uno normal y otro en incógnito), y registrar dos usuarios distintos.
   Desde el panel de cada uno, usa el formulario "Añadir saldo" para darles
   saldo antes de sentarlos a la mesa. Ambos deben elegir el **mismo número
   de jugadores y el mismo importe** para acabar en la misma mesa (si el
   importe no coincide, el emparejamiento los sienta en mesas distintas).

## Siguiente paso
Posibles mejoras: botón de recarga en el propio frontend, lobby con lista de
mesas activas, reconexión automática del socket si se cae la conexión.
