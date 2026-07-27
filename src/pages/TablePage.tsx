import { FormEvent, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { PlayingCard, CardBack } from "../components/PlayingCard";
import {
  BUY_IN_TIERS_EUROS,
  HandPublicState,
  PHASE_LABELS,
  PlayerAction,
  ROOM_CAPACITIES,
  TableStateMessage,
} from "../game/types";

const SOCKET_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:4000";

// El motor limita cualquier apuesta al stack real del jugador (ver paso de
// all-in), así que para "ir all-in" basta con pedir una cantidad simbólica
// muy alta: el backend la recorta automáticamente a lo que de verdad tiene.
const ALL_IN_SENTINEL_AMOUNT = 999_999_999_999;

function eurosToCents(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function TablePage({ onExit }: { onExit: () => void }) {
  const { user, accessToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  const [selectedCapacity, setSelectedCapacity] = useState<number>(2);
  const [selectedBuyIn, setSelectedBuyIn] = useState<number>(10);
  const [roomMode, setRoomMode] = useState<"public" | "private">("public");
  const [privateAction, setPrivateAction] = useState<"create" | "join">("create");
  const [joinCode, setJoinCode] = useState("");
  const [tableState, setTableState] = useState<TableStateMessage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("1.00");
  const [selectedDiscards, setSelectedDiscards] = useState<number[]>([]);
  const [hasDiscardedThisPhase, setHasDiscardedThisPhase] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // Conecta el socket una vez, al montar la página. Se desconecta al salir.
  useEffect(() => {
    if (!accessToken) return;
    const socket = io(SOCKET_URL, { auth: { token: accessToken } });
    socketRef.current = socket;

    socket.on("table:state", (state: TableStateMessage) => {
      setTableState(state);
      setErrorMessage(null);
    });
    socket.on("table:error", (err: { message: string }) => {
      setErrorMessage(err.message);
    });
    socket.on("connect_error", (err) => {
      setErrorMessage(`No se pudo conectar: ${err.message}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Al cambiar de fase, se resetea la selección de descarte local.
  useEffect(() => {
    setSelectedDiscards([]);
    if (tableState?.hand?.phase !== "discard") {
      setHasDiscardedThisPhase(false);
    }
  }, [tableState?.hand?.phase]);

  // Cuenta atrás en vivo: el servidor solo manda EL INSTANTE en el que
  // arrancará (startsAt), así que aquí se recalculan los segundos restantes
  // localmente, sin depender de que lleguen más mensajes del servidor.
  useEffect(() => {
    const startsAt = tableState?.startsAt ?? null;
    if (!startsAt) {
      setCountdownSeconds(null);
      return;
    }
    const update = () => setCountdownSeconds(Math.max(0, Math.ceil((startsAt - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [tableState?.startsAt]);

  function joinTable(e: FormEvent) {
    e.preventDefault();
    if (roomMode === "public") {
      socketRef.current?.emit("table:join", { capacity: selectedCapacity, buyInEuros: selectedBuyIn });
      return;
    }
    if (privateAction === "create") {
      socketRef.current?.emit("table:createPrivate", { capacity: selectedCapacity, buyInEuros: selectedBuyIn });
      return;
    }
    socketRef.current?.emit("table:joinPrivate", { code: joinCode.trim() });
  }

  function leaveTable() {
    socketRef.current?.emit("table:leave");
    setTableState(null);
  }

  function rebuy() {
    socketRef.current?.emit("table:rebuy");
  }

  function sendAction(action: PlayerAction) {
    socketRef.current?.emit("hand:action", action);
  }

  function submitDiscard() {
    socketRef.current?.emit("hand:discard", { cardIndexes: selectedDiscards });
    setHasDiscardedThisPhase(true);
  }

  function toggleDiscardIndex(index: number) {
    setSelectedDiscards((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  }

  const usernameFor = (id: string) => tableState?.seatUsernames.find((s) => s.id === id)?.username ?? id.slice(0, 8);

  if (!tableState) {
    return (
      <div className="table-page">
        <div className="table-topbar">
          <h2 className="table-topbar-title">
            <img src="/images/icon.png" alt="" className="topbar-logo" />
            SIN LEY
          </h2>
          <button className="btn-logout" onClick={onExit}>
            Volver al panel
          </button>
        </div>
        <form className="join-form" onSubmit={joinTable}>
          <div className="mode-toggle" role="group" aria-label="Tipo de partida">
            <button
              type="button"
              className={`mode-toggle-btn${roomMode === "public" ? " mode-toggle-btn--active" : ""}`}
              onClick={() => setRoomMode("public")}
            >
              Partida pública
            </button>
            <button
              type="button"
              className={`mode-toggle-btn${roomMode === "private" ? " mode-toggle-btn--active" : ""}`}
              onClick={() => setRoomMode("private")}
            >
              Partida privada
            </button>
          </div>

          {roomMode === "public" ? (
            <p>
              Elige el tamaño de mesa y el importe de ficha: te emparejamos con quien esté buscando lo mismo. Todos
              los jugadores de una misma mesa se sientan con el mismo importe — así la partida es justa para todos.
            </p>
          ) : (
            <p>
              Crea una sala y comparte el código con tus amigos, o introduce el código que te hayan pasado para
              unirte a la suya.
            </p>
          )}

          {errorMessage && <div className="form-error">{errorMessage}</div>}

          {roomMode === "private" && (
            <div className="mode-toggle mode-toggle--sub" role="group" aria-label="Crear o unirse">
              <button
                type="button"
                className={`mode-toggle-btn${privateAction === "create" ? " mode-toggle-btn--active" : ""}`}
                onClick={() => setPrivateAction("create")}
              >
                Crear sala
              </button>
              <button
                type="button"
                className={`mode-toggle-btn${privateAction === "join" ? " mode-toggle-btn--active" : ""}`}
                onClick={() => setPrivateAction("join")}
              >
                Unirse con código
              </button>
            </div>
          )}

          {roomMode === "private" && privateAction === "join" ? (
            <div className="field">
              <label htmlFor="joinCode">Código de la sala</label>
              <input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}
              />
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="capacity">Número de jugadores</label>
                <select
                  id="capacity"
                  value={selectedCapacity}
                  onChange={(e) => setSelectedCapacity(Number(e.target.value))}
                >
                  {ROOM_CAPACITIES.map((c) => (
                    <option key={c} value={c}>
                      {c} jugadores
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="buyIn">Importe de la mesa</label>
                <select id="buyIn" value={selectedBuyIn} onChange={(e) => setSelectedBuyIn(Number(e.target.value))}>
                  {BUY_IN_TIERS_EUROS.map((amount) => (
                    <option key={amount} value={amount}>
                      {amount} €
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary">
            {roomMode === "public" ? "Buscar mesa" : privateAction === "create" ? "Crear sala privada" : "Unirse a la sala"}
          </button>
        </form>
      </div>
    );
  }

  const hand: HandPublicState | null = tableState.hand;
  const myId = user?.id;
  const myPlayer = hand?.players.find((p) => p.id === myId);
  const isMyTurn = hand?.actingPlayerId === myId;

  if (tableState.gameOver && tableState.standings) {
    const myStanding = tableState.standings.find((s) => s.userId === myId);
    return (
      <div className="table-page">
        <div className="table-topbar">
          <h2 className="table-topbar-title">
            <img src="/images/icon.png" alt="" className="topbar-logo" />
            Partida terminada
          </h2>
        </div>
        <div className="standings-panel">
          {myStanding && (
            <div className={`standings-highlight${myStanding.position === 1 ? " standings-highlight--winner" : ""}`}>
              <div className="pot-label">{myStanding.position === 1 ? "¡Has ganado la partida!" : "Has quedado"}</div>
              <div className="result-winner">
                {myStanding.position}
                {myStanding.position === 1 ? "º puesto" : "º puesto"}
              </div>
              <p className={`standings-net ${myStanding.netCents >= 0 ? "standings-net--positive" : "standings-net--negative"}`}>
                {myStanding.netCents >= 0 ? "+" : ""}
                {centsToEuros(myStanding.netCents)} €
              </p>
            </div>
          )}

          <table className="standings-table">
            <thead>
              <tr>
                <th>Puesto</th>
                <th>Jugador</th>
                <th>Fichas finales</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {tableState.standings.map((s) => (
                <tr key={s.userId} className={s.position === 1 ? "standings-row--winner" : ""}>
                  <td>{s.position}º</td>
                  <td>{usernameFor(s.userId)}</td>
                  <td>{centsToEuros(s.finalStackCents)} €</td>
                  <td className={s.netCents >= 0 ? "standings-net--positive" : "standings-net--negative"}>
                    {s.netCents >= 0 ? "+" : ""}
                    {centsToEuros(s.netCents)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            className="btn-primary"
            style={{ marginTop: "1.5rem" }}
            onClick={() => {
              leaveTable();
              onExit();
            }}
          >
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-page">
      <div className="table-topbar">
        <h2 className="table-topbar-title">
          <img src="/images/icon.png" alt="" className="topbar-logo" />
          Mesa de {tableState.capacity} — ficha {centsToEuros(tableState.buyInCents)} €
        </h2>
        {tableState.isPrivate && tableState.code && (
          <button
            type="button"
            className="room-code-badge"
            title="Copiar código para invitar a amigos"
            onClick={() => navigator.clipboard?.writeText(tableState.code!)}
          >
            Código: <strong>{tableState.code}</strong> ⧉
          </button>
        )}
        <div className="table-topbar-actions">
          <button className="btn-logout" onClick={leaveTable}>
            Salir de la mesa
          </button>
          <button className="btn-logout" onClick={onExit}>
            Panel
          </button>
        </div>
      </div>

      {errorMessage && <div className="form-error">{errorMessage}</div>}

      <div className="poker-table-oval">
        {(() => {
          const seatIds = tableState.seatOrder;
          const myIndex = myId ? seatIds.indexOf(myId) : -1;
          // Tu propio asiento siempre se dibuja abajo del todo; el resto se
          // reparte alrededor del óvalo en el mismo orden de turno.
          const ordered = myIndex >= 0 ? [...seatIds.slice(myIndex), ...seatIds.slice(0, myIndex)] : seatIds;
          const n = ordered.length;

          return ordered.map((seatId, i) => {
            const angle = Math.PI / 2 + (i * 2 * Math.PI) / n;
            const left = 50 + 45 * Math.cos(angle);
            const top = 50 + 43 * Math.sin(angle);
            const seatHandInfo = hand?.players.find((p) => p.id === seatId);
            const isConnected = tableState.connectedUserIds.includes(seatId);
            return (
              <div
                key={seatId}
                className={`seat${hand?.actingPlayerId === seatId ? " seat--acting" : ""}${
                  seatHandInfo?.folded ? " seat--folded" : ""
                }`}
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                {seatId === tableState.dealerId && <div className="dealer-chip">D</div>}
                {!isConnected && <span className="seat-disconnected-dot" title="Desconectado" />}
                <div className="seat-username">{usernameFor(seatId)}</div>
                {seatHandInfo?.allIn && !seatHandInfo.folded && (
                  <div className="seat-badge seat-badge--allin">All-in</div>
                )}
                <div className="seat-stack">{centsToEuros(tableState.stacks[seatId] ?? 0)} €</div>
                {seatId === myId && !hand && (tableState.stacks[seatId] ?? 0) <= 0 && (
                  <button className="action-btn-allin" style={{ marginTop: "0.4rem" }} onClick={rebuy}>
                    Comprar fichas ({centsToEuros(tableState.buyInCents)} €)
                  </button>
                )}
                {seatHandInfo && (
                  <>
                    <div className="seat-meta">
                      {seatHandInfo.folded ? "Retirado" : `Apostado: ${centsToEuros(seatHandInfo.currentRoundBet)} €`}
                    </div>
                    {seatId !== myId && !seatHandInfo.folded && (
                      <div className="opponent-cards">
                        {seatHandInfo.hand
                          ? seatHandInfo.hand.map((card, ci) => <PlayingCard key={ci} card={card} />)
                          : Array.from({ length: seatHandInfo.cardCount }).map((_, ci) => <CardBack key={ci} />)}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          });
        })()}

        <div className="table-center">
          {hand ? (
            <>
              <div className="phase-label">{PHASE_LABELS[hand.phase]}</div>
              <div className="pot-label">Bote</div>
              <div className="pot-display">{centsToEuros(hand.pot)} €</div>
              {hand.actingPlayerId && hand.phase !== "finished" && (
                <div className="turn-indicator">
                  {isMyTurn ? "Es tu turno" : `Turno de ${usernameFor(hand.actingPlayerId)}`}
                </div>
              )}
              {!hand.actingPlayerId &&
                ["betting_1", "betting_2", "betting_final"].includes(hand.phase) && (
                  <div className="turn-indicator">Sin más apuestas: se completa la mano a cartas vistas</div>
                )}
            </>
          ) : countdownSeconds !== null ? (
            <div className="countdown-badge">
              <div className="countdown-number">{countdownSeconds}</div>
              <div className="pot-label">La partida empieza en...</div>
            </div>
          ) : (
            <p className="waiting-note">Esperando a que se siente al menos otro jugador con fichas...</p>
          )}
        </div>
      </div>

      {hand?.phase === "finished" && hand.result && (
        <div className="result-panel">
          <div className="pot-label">{hand.result.payouts.length > 1 ? "Bote dividido" : "Ganador"}</div>
          {hand.result.payouts.map((payout) => (
            <div className="result-winner" key={payout.playerId}>
              {usernameFor(payout.playerId)} — {centsToEuros(payout.amount)} €
            </div>
          ))}
          <p className="result-detail">Bote total: {centsToEuros(hand.result.pot)} €</p>
          <p className="result-detail">
            Motivo:{" "}
            {hand.result.reason === "fold"
              ? "los demás se retiraron"
              : hand.result.reason === "instant_flush"
                ? "póker de palo instantáneo"
                : "showdown"}
          </p>
          {Object.entries(hand.result.evaluations).map(([playerId, evaluation]) => (
            <p className="result-detail" key={playerId}>
              {usernameFor(playerId)}: {evaluation.handTypeLabel}
            </p>
          ))}
          <p className="waiting-note" style={{ marginTop: "1rem" }}>
            {countdownSeconds !== null
              ? `La siguiente mano empieza en ${countdownSeconds}s...`
              : "La siguiente mano empezará sola en unos segundos..."}
          </p>
        </div>
      )}

      {hand && hand.phase !== "finished" && myPlayer && (
        <div className="own-hand-area">
          <div className="own-hand-cards">
            {(myPlayer.hand ?? []).map((card, index) => (
              <PlayingCard
                key={index}
                card={card}
                selected={selectedDiscards.includes(index)}
                onClick={
                  hand.phase === "discard" && !hasDiscardedThisPhase ? () => toggleDiscardIndex(index) : undefined
                }
              />
            ))}
          </div>

          {hand.phase === "discard" && !myPlayer.folded && (
            <div className="action-bar">
              {hasDiscardedThisPhase ? (
                <p className="waiting-note">Esperando al resto de jugadores...</p>
              ) : (
                <button className="action-btn-primary" onClick={submitDiscard}>
                  {selectedDiscards.length === 0
                    ? "No descartar nada"
                    : `Descartar ${selectedDiscards.length} carta(s)`}
                </button>
              )}
            </div>
          )}

          {isMyTurn && ["betting_1", "betting_2", "betting_final"].includes(hand.phase) && (
            <div className="action-bar-wrap">
              {hand.pot > 0 && (
                <div className="pot-preset-row">
                  {[0.5, 1, 2].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      className="pot-preset-btn"
                      onClick={() => setBetAmount(centsToEuros(Math.round(hand.pot * mult)))}
                    >
                      {mult === 0.5 ? "½ bote" : mult === 1 ? "Bote" : "2x bote"}
                    </button>
                  ))}
                </div>
              )}
              <div className="action-bar">
                {hand.currentBetToMatch === 0 ? (
                  <>
                    <button className="action-btn-secondary" onClick={() => sendAction({ type: "pass" })}>
                      Pasar
                    </button>
                    <input
                      className="bet-input"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      inputMode="decimal"
                    />
                    <button
                      className="action-btn-primary"
                      onClick={() => sendAction({ type: "bet", amount: eurosToCents(betAmount) })}
                    >
                      Apostar
                    </button>
                    <button
                      className="action-btn-allin"
                      onClick={() => sendAction({ type: "bet", amount: ALL_IN_SENTINEL_AMOUNT })}
                    >
                      All-in
                    </button>
                  </>
                ) : (
                  <>
                    <button className="action-btn-fold" onClick={() => sendAction({ type: "fold" })}>
                      Retirarse
                    </button>
                    <button className="action-btn-primary" onClick={() => sendAction({ type: "call" })}>
                      Igualar ({centsToEuros(hand.currentBetToMatch - (myPlayer.currentRoundBet ?? 0))} €)
                    </button>
                    <input
                      className="bet-input"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      inputMode="decimal"
                    />
                    <button
                      className="action-btn-secondary"
                      onClick={() => sendAction({ type: "raise", amount: eurosToCents(betAmount) })}
                    >
                      Subir a
                    </button>
                    <button
                      className="action-btn-allin"
                      onClick={() => sendAction({ type: "raise", amount: ALL_IN_SENTINEL_AMOUNT })}
                    >
                      All-in
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {!isMyTurn && hand.phase !== "discard" && hand.actingPlayerId && !myPlayer.folded && (
            <p className="waiting-note">Esperando tu turno...</p>
          )}
        </div>
      )}
    </div>
  );
}
