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
  // Lógica:
  // 1. Comparar montos nominales (efectivo vs total cuotas)
  // 2. Si hay inflación, calcular cuánto "licúa" el recargo
  // 3. Decisión final considerando ambos factores

  let mejorOpcion, claseMejor, texto, consejo, claseRecargo;

  // Recargo nominal sobre el precio de efectivo
  // (independiente de si el usuario lo declaró o surge de la diferencia de montos)
  const recargoPctReal = recargoPct; // ((totalCuotas / efectivo) - 1) * 100

  // Costo real ajustado por inflación (si hay dato)
  const costoPctReal = tieneInflacion ? ((valorReal / efectivo) - 1) * 100 : recargoPctReal;

  if (diff <= 0) {
    // Cuotas más baratas o igual que efectivo → siempre convienen cuotas
    mejorOpcion = '✓ Cuotas';
    claseMejor  = 'verde';
    texto = `En cuotas pagás ${fmt(totalCuotasNominal)}, menos que en efectivo (${fmt(efectivo)}). No hay recargo.`;
    consejo = 'Aprovechá las cuotas: pagás lo mismo o menos y conservás tu liquidez.';
    claseRecargo = 'green';
  } else if (tieneInflacion && valorReal <= efectivo) {
    // Cuotas nominalmente más caras, pero la inflación las hace convenientes
    mejorOpcion = '✓ Cuotas';
    claseMejor  = 'verde';
    texto = `Nominalmente las cuotas cuestan ${fmt(diff)} más (${fmtPct(recargoPctReal)}), pero con inflación del ${inflMensual}% mensual el costo real baja a ${fmt(valorReal)} — igual o menor al efectivo.`;
    consejo = `La inflación licúa el recargo: pagás ${fmtPct(recargoPctReal)} más en papel, pero en valor real es ${fmtPct(costoPctReal)}. Las cuotas convienen.`;
    claseRecargo = 'green';
  } else if (tieneInflacion && valorReal > efectivo) {
    // Cuotas más caras incluso ajustando por inflación → efectivo conviene
    mejorOpcion = '✓ Efectivo';
    claseMejor  = 'azul';
    texto = `Las cuotas cuestan ${fmt(diff)} más (${fmtPct(recargoPctReal)} nominal). Ajustando por inflación del ${inflMensual}% mensual, el costo real sigue siendo ${fmt(valorReal)}, mayor al efectivo (${fmt(efectivo)}).`;
    consejo = `La inflación no alcanza a compensar el recargo. Ahorrás ${fmt(valorReal - efectivo)} pagando hoy.`;
    claseRecargo = 'red';
  } else if (recargoPctReal < 5) {
    // Sin inflación, recargo bajo → depende de la liquidez
    mejorOpcion = '~ Depende';
    claseMejor  = 'neutro';
    texto = `Las cuotas tienen un recargo bajo: ${fmtPct(recargoPctReal)} (${fmt(diff)} extra). Total cuotas: ${fmt(totalCuotasNominal)} vs ${fmt(efectivo)} de contado.`;
    consejo = 'El recargo es pequeño. Si no necesitás el efectivo, pagá de contado. Si preferís no descapitalizarte, las cuotas son razonables.';
    claseRecargo = '';
  } else {
    // Sin inflación, recargo significativo → efectivo conviene
    mejorOpcion = '✓ Efectivo';
    claseMejor  = 'azul';
    texto = `Las cuotas tienen un recargo de ${fmtPct(recargoPctReal)} (${fmt(diff)} extra). Total cuotas: ${fmt(totalCuotasNominal)} vs ${fmt(efectivo)} de contado.`;
    consejo = `Pagando en efectivo ahorrás ${fmt(diff)}. Las cuotas solo convienen si necesitás preservar liquidez o esperás que la inflación supere el ${fmtPct(recargoPctReal)} de recargo.`;
    claseRecargo = 'red';
  }

  // ── Pintar ─────────────────────────────────────────────────────────────────
  const mejorEl = document.getElementById('mejor-opcion');
  mejorEl.textContent = mejorOpcion;
  mejorEl.className   = 'mejor-opcion-valor ' + claseMejor;
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