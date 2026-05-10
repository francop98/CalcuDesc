function fmt(n) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function calcular() {
  const pct    = parseFloat(document.getElementById('descuento').value);
  const tope   = parseFloat(document.getElementById('tope').value);
  const error  = document.getElementById('error');
  const result = document.getElementById('result');

  if (!pct || !tope || pct <= 0 || pct >= 100 || tope <= 0) {
    error.classList.add('show');
    result.classList.remove('show');
    return;
  }
  error.classList.remove('show');

  // Para aprovechar 100% el tope:
  // reintegro = gasto * (pct/100) = tope
  // gasto = tope / (pct/100)
  const gastoMax  = tope / (pct / 100);
  const reintegro = tope; // exactamente el tope
  const pagoFinal = gastoMax - reintegro;
  const ahorroReal = reintegro;

  document.getElementById('res-gasto').textContent     = fmt(gastoMax);
  document.getElementById('res-reintegro').textContent = fmt(reintegro);
  document.getElementById('res-final').textContent     = fmt(pagoFinal);
  document.getElementById('res-pct').textContent       = pct + '%';
  document.getElementById('res-ahorro').textContent    = fmt(ahorroReal);

  // Reflow trick para re-animar
  result.classList.remove('show');
  void result.offsetWidth;
  result.classList.add('show');
}

function resetear() {
  document.getElementById('result').classList.remove('show');
  document.getElementById('descuento').value = '';
  document.getElementById('tope').value = '';
  document.getElementById('descuento').focus();
}

// Enter key support
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') calcular();
});