export default function Carregando() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="visualmente-oculto">Carregando…</p>
      <div className="grade-destaques">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="esqueleto" />
        ))}
      </div>
      <div className="esqueleto" style={{ height: 280 }} />
    </div>
  );
}
