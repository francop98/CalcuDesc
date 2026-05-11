// ── Inflación ────────────────────────────────────────────────────────────────
// Dato hardcodeado del último IPC mensual publicado por INDEC.
// Actualizarlo manualmente una vez por mes cuando sale el informe del INDEC
// (siempre los primeros días del mes siguiente).
// ⚠️  ACTUALIZAR ESTOS DOS VALORES CADA MES:
const IPC_VALOR = 3.4;      // % mensual — fuente: INDEC
const IPC_MES   = 'Marzo 2026'; // mes al que corresponde

// ── Formato ──────────────────────────────────────────────────────────────────
function fmt(n) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}
function fmtPct(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

// ── Estado de inflación ───────────────────────────────────────────────────────
let inflacionAuto = IPC_VALOR;

function iniciarInflacion() {
  const badge    = document.getElementById('inflacion-badge');
  const wrapInfl = document.getElementById('inflacion-wrap');

  badge.className = 'inflacion-badge ok';
  // Ocultar input manual — el dato ya está cargado
  wrapInfl.classList.add('hidden');
}

// ── Toggle recargo ────────────────────────────────────────────────────────────
function toggleRecargo() {
  const sinInteres = document.getElementById('opt-sin-interes');
  const wrapRecargo = document.getElementById('wrap-recargo');
  if (sinInteres.checked) {
    wrapRecargo.classList.add('hidden');
  } else {
    wrapRecargo.classList.remove('hidden');
  }
}

// ── Cálculo principal ─────────────────────────────────────────────────────────
function calcularCuotas() {
  const efectivo      = parseFloat(document.getElementById('precio-efectivo').value);
  const totalCuotas_i = parseFloat(document.getElementById('precio-cuota').value);
  const nCuotas       = parseInt(document.getElementById('cant-cuotas').value);
  // Cuota mensual = total en cuotas / cantidad de cuotas
  const cuota = totalCuotas_i / nCuotas;
  const error    = document.getElementById('error-cuotas');
  const result   = document.getElementById('result-cuotas');

  // Recargo
  const conRecargo   = document.getElementById('opt-con-recargo').checked;
  const recargoPctInput = parseFloat(document.getElementById('recargo-pct').value);

  // Inflación: primero auto, luego manual
  let inflMensual;
  if (inflacionAuto !== null) {
    inflMensual = inflacionAuto;
  } else {
    inflMensual = parseFloat(document.getElementById('inflacion').value);
  }

  if (!efectivo || !totalCuotas_i || !nCuotas || efectivo <= 0 || totalCuotas_i <= 0 || nCuotas < 1) {
    error.classList.add('show');
    result.classList.remove('show');
    return;
  }
  if (conRecargo && (isNaN(recargoPctInput) || recargoPctInput <= 0)) {
    error.textContent = 'Indicá el porcentaje de recargo.';
    error.classList.add('show');
    result.classList.remove('show');
    return;
  }
  error.classList.remove('show');
  error.textContent = 'Completá precio efectivo, cuota y cantidad de cuotas.';

  // Cuota real: si tiene recargo, el valor de cuota ya lo incluye; si es sin interés, no hay recargo extra.
  // El recargo % se aplica sobre el total de cuotas para validación / info adicional.
  const totalCuotasNominal = cuota * nCuotas;

  // Si hay recargo, mostramos también el recargo que ya está incluido
  const recargoDeclarado = conRecargo ? recargoPctInput : 0;

  const diff       = totalCuotasNominal - efectivo;
  const recargoPct = ((totalCuotasNominal / efectivo) - 1) * 100;

  // Valor presente ajustado por inflación
  const tieneInflacion = !isNaN(inflMensual) && inflMensual > 0;
  let valorReal = 0;
  if (tieneInflacion) {
    const r = inflMensual / 100;
    for (let k = 1; k <= nCuotas; k++) {
      valorReal += cuota / Math.pow(1 + r, k);
    }
  }

  // ── Veredicto ──────────────────────────────────────────────────────────────
  let icono, texto, consejo, claseRecargo;

  if (!conRecargo) {
    // Sin interés
    if (diff <= 0) {
      icono = '✓';
      texto = `Las cuotas sin interés son iguales o más baratas que el efectivo. Total: ${fmt(totalCuotasNominal)}.`;
      consejo = 'Cuotas sin interés son lo ideal: preservás tu liquidez sin pagar de más.';
      claseRecargo = 'green';
    } else {
      // Raro que pase, pero por si el usuario ingresó mal los datos
      icono = '~';
      texto = `El total en cuotas (${fmt(totalCuotasNominal)}) supera el precio de contado. Verificá los datos.`;
      consejo = '';
      claseRecargo = '';
    }
  } else if (tieneInflacion) {
    if (valorReal < efectivo) {
      icono = '✓';
      texto = `Con inflación del ${inflMensual}% mensual, las cuotas te convienen: el valor real de lo que pagás es ${fmt(valorReal)}, menos que el contado.`;
      consejo = `La inflación "licúa" las cuotas: el recargo nominal es ${fmtPct(recargoPct)}, pero el costo real es ${fmtPct(((valorReal / efectivo) - 1) * 100)}.`;
      claseRecargo = 'green';
    } else {
      icono = '✗';
      texto = `Aun con inflación del ${inflMensual}% mensual, el efectivo sigue siendo más conveniente. El valor presente de las cuotas (${fmt(valorReal)}) supera el contado.`;
      consejo = `La inflación no alcanza a compensar el recargo del ${fmtPct(recargoPct)}. Conviene pagar ${fmt(efectivo)} hoy.`;
      claseRecargo = 'red';
    }
  } else {
    // Con recargo, sin dato de inflación
    if (diff <= 0) {
      icono = '✓';
      texto = `Las cuotas son iguales o más baratas que el efectivo. Total en cuotas: ${fmt(totalCuotasNominal)}.`;
      consejo = 'Aprovechá las cuotas: pagás lo mismo o menos.';
      claseRecargo = 'green';
    } else if (recargoPct < 5) {
      icono = '~';
      texto = `Las cuotas tienen un recargo bajo (${fmtPct(recargoPct)}). Depende de si necesitás el efectivo disponible.`;
      consejo = 'Si tenés el dinero y no lo necesitás, el efectivo es más conveniente. Si preferís no descapitalizarte, las cuotas son razonables.';
      claseRecargo = '';
    } else {
      icono = '✗';
      texto = `Las cuotas tienen un recargo de ${fmtPct(recargoPct)} (${fmt(diff)} extra). El efectivo es más conveniente.`;
      consejo = `Pagando en efectivo ahorrás ${fmt(diff)}. Solo convienen las cuotas si la inflación supera ese recargo o necesitás preservar liquidez.`;
      claseRecargo = 'red';
    }
  }

  // ── Pintar ─────────────────────────────────────────────────────────────────
  document.getElementById('veredicto-icon').textContent  = icono;
  document.getElementById('veredicto-texto').textContent = texto;
  document.getElementById('res-ef').textContent          = fmt(efectivo);
  document.getElementById('res-cuotas-total').textContent= fmt(totalCuotasNominal);
  document.getElementById('res-diff').textContent        = fmt(Math.abs(diff));
  document.getElementById('res-recargo').textContent     = fmtPct(recargoPct);
  document.getElementById('res-recargo').className       = 'breakdown-value ' + claseRecargo;
  document.getElementById('consejo').textContent         = consejo;

  // Fila de recargo declarado
  const filaRecargo = document.getElementById('recargo-declarado-row');
  if (conRecargo && recargoDeclarado > 0) {
    document.getElementById('res-recargo-declarado').textContent = '+' + recargoDeclarado.toFixed(1) + '%';
    filaRecargo.style.display = '';
  } else {
    filaRecargo.style.display = 'none';
  }

  // Fila inflación
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

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetCuotas() {
  document.getElementById('result-cuotas').classList.remove('show');
  ['precio-efectivo', 'precio-cuota', 'cant-cuotas', 'inflacion', 'recargo-pct'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  // Volver a "Sin interés"
  document.getElementById('opt-sin-interes').checked = true;
  toggleRecargo();
  document.getElementById('precio-efectivo').focus();
}

// ── Enter ─────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') calcularCuotas();
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  iniciarInflacion();
  toggleRecargo();
});