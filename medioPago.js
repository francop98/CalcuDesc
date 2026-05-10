function fmt(n) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function fmtPct(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

function calcularCuotas() {
  const efectivo    = parseFloat(document.getElementById('precio-efectivo').value);
  const cuota       = parseFloat(document.getElementById('precio-cuota').value);
  const nCuotas     = parseInt(document.getElementById('cant-cuotas').value);
  const inflMensual = parseFloat(document.getElementById('inflacion').value);
  const error       = document.getElementById('error-cuotas');
  const result      = document.getElementById('result-cuotas');

  if (!efectivo || !cuota || !nCuotas || efectivo <= 0 || cuota <= 0 || nCuotas < 1) {
    error.classList.add('show');
    result.classList.remove('show');
    return;
  }
  error.classList.remove('show');

  const totalCuotas = cuota * nCuotas;
  const diff        = totalCuotas - efectivo;
  const recargoPct  = ((totalCuotas / efectivo) - 1) * 100;

  // Valor presente de las cuotas ajustado por inflación
  const tieneInflacion = !isNaN(inflMensual) && inflMensual > 0;
  let valorReal = 0;

  if (tieneInflacion) {
    const r = inflMensual / 100;
    for (let k = 1; k <= nCuotas; k++) {
      valorReal += cuota / Math.pow(1 + r, k);
    }
  }

  // Veredicto
  let icono, texto, consejo, claseRecargo;

  if (tieneInflacion) {
    if (valorReal < efectivo) {
      icono        = '✓';
      texto        = `Con una inflación del ${inflMensual}% mensual, las cuotas te convienen: el valor real de lo que pagás es ${fmt(valorReal)}, menos que el precio de contado.`;
      consejo      = `La inflación "licúa" las cuotas: pagás ${fmt(cuota)} por mes, pero cada peso futuro vale menos. El recargo nominal es ${fmtPct(recargoPct)}, pero el costo real es ${fmtPct(((valorReal / efectivo) - 1) * 100)}.`;
      claseRecargo = 'green';
    } else {
      icono        = '✗';
      texto        = `Aun considerando la inflación, el efectivo sigue siendo más conveniente. El valor presente de las cuotas (${fmt(valorReal)}) supera el precio de contado.`;
      consejo      = `La inflación no alcanza a compensar el recargo. Te conviene pagar ${fmt(efectivo)} hoy.`;
      claseRecargo = 'red';
    }
  } else {
    if (diff <= 0) {
      icono        = '✓';
      texto        = `Las cuotas son iguales o más baratas que el efectivo. Total en cuotas: ${fmt(totalCuotas)}.`;
      consejo      = 'Aprovechar las cuotas sin interés es lo ideal: pagás lo mismo o menos y preservás tu liquidez.';
      claseRecargo = 'green';
    } else if (recargoPct < 5) {
      icono        = '~';
      texto        = `Las cuotas tienen un recargo bajo (${fmtPct(recargoPct)}). Depende de si necesitás el efectivo disponible.`;
      consejo      = 'Si tenés el dinero y no lo necesitás para otra cosa, el efectivo es más conveniente. Si preferís no descapitalizarte, las cuotas son razonables.';
      claseRecargo = '';
    } else {
      icono        = '✗';
      texto        = `Las cuotas tienen un recargo de ${fmtPct(recargoPct)} (${fmt(diff)} extra). El efectivo es más conveniente.`;
      consejo      = `Pagando en efectivo ahorrás ${fmt(diff)}. Solo convienen las cuotas si la inflación supera ese recargo o si necesitás preservar liquidez.`;
      claseRecargo = 'red';
    }
  }

  // Pintar
  document.getElementById('veredicto-icon').textContent  = icono;
  document.getElementById('veredicto-texto').textContent = texto;
  document.getElementById('res-ef').textContent           = fmt(efectivo);
  document.getElementById('res-cuotas-total').textContent = fmt(totalCuotas);
  document.getElementById('res-diff').textContent         = fmt(Math.abs(diff));
  document.getElementById('res-recargo').textContent      = fmtPct(recargoPct);
  document.getElementById('res-recargo').className        = 'breakdown-value ' + claseRecargo;
  document.getElementById('consejo').textContent          = consejo;

  const inflRow = document.getElementById('inflacion-row');
  if (tieneInflacion) {
    document.getElementById('res-real').textContent = fmt(valorReal);
    inflRow.style.display = '';
  } else {
    inflRow.style.display = 'none';
  }

  result.classList.remove('show');
  void result.offsetWidth;
  result.classList.add('show');
}

function resetCuotas() {
  document.getElementById('result-cuotas').classList.remove('show');
  ['precio-efectivo', 'precio-cuota', 'cant-cuotas', 'inflacion'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('precio-efectivo').focus();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') calcularCuotas();
});