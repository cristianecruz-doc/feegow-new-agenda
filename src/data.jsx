/* ============================================================================
   Feegow — New Agenda · Mock data (realistic Brazilian clinic)
   "Hoje" = o dia REAL em que o protótipo é aberto. Todos os exemplos de
   agendamentos e horários livres são gerados para o mês inteiro, relativos a
   este dia, para que a agenda esteja sempre "viva" seja qual for a data.
   ============================================================================ */

const _isoOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const _NOW = new Date();
const _TODAY_D = new Date(_NOW.getFullYear(), _NOW.getMonth(), _NOW.getDate());
const TODAY = _isoOf(_TODAY_D);                 // dia atual (real)
const _MON_D = (() => { const x = new Date(_TODAY_D); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; })();
const WEEK_START = _isoOf(_MON_D);              // segunda-feira da semana atual
const NOW_DT = _NOW;                            // "agora" = horário real de abertura
const NOW_MIN_D = _NOW.getHours() * 60 + _NOW.getMinutes();

// ---- Professionals ----------------------------------------------------------
const PROS = [
  { id: 'p1', name: 'Dra. Renata Alves',   short: 'R. Alves',   initials: 'RA', spec: 'Dermatologia',  specs: ['Dermatologia', 'Tricologia'], room: 'Consultório 1 · Pardal',     unit: 'Unidade Centro',   color: '#007c68', doctoralia: true },
  { id: 'p2', name: 'Dr. Bruno Tavares',   short: 'B. Tavares', initials: 'BT', spec: 'Ortopedia',     specs: ['Ortopedia', 'Traumatologia', 'Medicina Esportiva'], room: 'Consultório 2 · Bem-te-vi',  unit: 'Unidade Centro',   color: '#1b5ea9' },
  { id: 'p3', name: 'Dra. Camila Souza',   short: 'C. Souza',   initials: 'CS', spec: 'Cardiologia',   room: 'Consultório 3 · Sabiá',      unit: 'Unidade Centro',   color: '#a23a7a', doctoralia: true },
  { id: 'p4', name: 'Dr. Felipe Moreira',  short: 'F. Moreira', initials: 'FM', spec: 'Clínico Geral',  room: 'Consultório 4 · Tucano',     unit: 'Unidade Zona Sul', color: '#b06400' },
  { id: 'p5', name: 'Dra. Patrícia Lima',  short: 'P. Lima',    initials: 'PL', spec: 'Pediatria',     room: 'Consultório 5 · Colibri',    unit: 'Unidade Zona Sul', color: '#0e7aa0', doctoralia: true },
];
// especialidades de um profissional (array) + label "primeira +X"
const specsOf = pro => (pro && pro.specs && pro.specs.length ? pro.specs : (pro && pro.spec ? [pro.spec] : []));
const specLabel = pro => { const l = specsOf(pro); return l.length > 1 ? `${l[0]} +${l.length - 1}` : (l[0] || ''); };
const proHasSpec = (pro, s) => specsOf(pro).includes(s);

// ---- Equipment / resources (first-class columns) ----------------------------
const EQUIP = [
  { id: 'e1', name: 'Ultrassom GE Logiq',   initials: 'US', spec: 'Sala de Ultrassom',     color: '#7b3fb0' },
  { id: 'e2', name: 'Eletrocardiógrafo',    initials: 'ECG', spec: 'Sala de Exames',        color: '#a23a7a' },
  { id: 'e3', name: 'Sala de Procedimentos', initials: 'SP', spec: 'Procedimentos',          color: '#007c68' },
];

// ---- Rooms / consultórios (also selectable as columns) ----------------------
const ROOMS = [
  { id: 'r1', name: 'Consultório 1 · Pardal',    initials: 'C1', spec: 'Dermatologia', unit: 'Unidade Centro',   color: '#1b5ea9' },
  { id: 'r2', name: 'Consultório 2 · Bem-te-vi', initials: 'C2', spec: 'Ortopedia',    unit: 'Unidade Centro',   color: '#0e7aa0' },
  { id: 'r3', name: 'Consultório 3 · Sabiá',     initials: 'C3', spec: 'Cardiologia',  unit: 'Unidade Centro',   color: '#a23a7a' },
  { id: 'r4', name: 'Consultório 4 · Tucano',    initials: 'C4', spec: 'Clínico Geral', unit: 'Unidade Zona Sul', color: '#b06400' },
  { id: 'r5', name: 'Consultório 5 · Colibri',   initials: 'C5', spec: 'Pediatria',    unit: 'Unidade Zona Sul', color: '#007c68' },
  { id: 'r6', name: 'Sala de Procedimentos',     initials: 'SP', spec: 'Procedimentos', unit: 'Unidade Centro',   color: '#6d3aa6' },
  { id: 'r7', name: 'Sala de Ultrassom',         initials: 'SU', spec: 'Imagem',        unit: 'Unidade Centro',   color: '#7b3fb0' },
];
// nome curto da sala (parte após o "·"): "Consultório 1 · Pardal" → "Pardal"
const roomShort = name => !name ? '' : (name.includes('·') ? name.split('·').pop().trim() : name);
// sala efetiva: explícita no agendamento → sala da grade ativa no horário → sala-base do profissional
const effectiveRoom = a => a.room || gradeRoomAt(a.pro, a.date, a.start) || (PROS.find(p => p.id === a.pro) || {}).room || null;

// ---- Availability grades (grade de horários de atendimento) -----------------
// Cada médico monta blocos por dia da semana. Cada bloco: início/fim, intervalo
// padrão (slotMin → duração padrão do agendamento quando o procedimento não tem
// tempo mínimo), cor (padrão verde), e limites de convênios/procedimentos.
// days: 0=dom … 6=sáb.
// Cada bloco pode ter: label, color (padrão verde), slotMin (intervalo → duração
// padrão quando o procedimento não tem tempo configurado), procs (null = todos),
// convenios (null = todos). days: 0=dom … 6=sáb.
const GREEN = '#1c7f00';
const GRADES = [
  // Dra. Renata — manhã de consultas no Pardal, tarde de procedimentos no Bem-te-vi
  // (exemplo: mesmo profissional, dois turnos em salas diferentes)
  { pro: 'p1', days: [1, 2, 3, 4, 5], start: '08:00', end: '12:00', slotMin: 30, color: GREEN,      label: 'Consultas',     procs: ['derm', 'retorno', 'tele'], convenios: ['Particular', 'Unimed'], room: 'Consultório 1 · Pardal', doctoralia: true },
  { pro: 'p1', days: [1, 2, 3, 4, 5], start: '13:00', end: '18:00', slotMin: 45, color: '#7b3fb0',  label: 'Procedimentos', procs: ['mapa', 'infil', 'usg'], convenios: ['Particular', 'Unimed'], room: 'Consultório 2 · Bem-te-vi' },
  { pro: 'p1', days: [6],             start: '08:00', end: '12:00', slotMin: 30, color: GREEN,      label: 'Consultas',     procs: ['derm', 'retorno'], convenios: ['Particular', 'Unimed'], room: 'Consultório 1 · Pardal', doctoralia: true },
  // Dr. Bruno — dois turnos verdes
  { pro: 'p2', days: [1, 2, 3, 4, 5], start: '08:00', end: '13:30', slotMin: 30, color: GREEN,      label: '',   room: 'Consultório 2 · Bem-te-vi', procs: ['orto', 'retorno'], convenios: ['Particular', 'SulAmérica'], intervals: [{ start: '12:00', end: '12:30', label: 'Almoço' }] },
  { pro: 'p2', days: [1, 2, 3, 4, 5], start: '14:00', end: '18:00', slotMin: 30, color: GREEN,      label: '',   room: 'Consultório 2 · Bem-te-vi', procs: ['orto', 'retorno', 'infil'], convenios: ['Particular', 'SulAmérica'] },
  // Dra. Camila — dia todo, convênios limitados
  { pro: 'p3', days: [1, 2, 3, 4, 5], start: '08:00', end: '17:00', slotMin: 40, color: '#0e7aa0',  label: 'Cardiologia',   procs: ['cardio', 'retorno', 'ecg', 'tele'], convenios: ['Particular', 'Unimed', 'Bradesco Saúde'], intervals: [{ start: '12:00', end: '13:00', label: 'Almoço' }], doctoralia: true },
  // Dr. Felipe — clínico
  { pro: 'p4', days: [1, 2, 3, 4, 5], start: '08:00', end: '15:30', slotMin: 30, color: GREEN,      label: 'Clínica geral', procs: ['clinico', 'retorno', 'tele'], convenios: ['Particular', 'Amil'], intervals: [{ start: '12:00', end: '13:00', label: 'Almoço' }] },
  // Dra. Patrícia — manhã consultas, tarde vacinação
  { pro: 'p5', days: [1, 2, 3, 4, 5], start: '08:00', end: '12:00', slotMin: 30, color: GREEN,      label: 'Consultas',     procs: ['pedia', 'retorno'], convenios: ['Particular', 'Bradesco Saúde'], doctoralia: true },
  { pro: 'p5', days: [2, 4],          start: '14:00', end: '16:00', slotMin: 15, color: '#b06400',  label: 'Vacinação',     procs: ['vacina'], convenios: ['Particular', 'Bradesco Saúde'] },
];
function gradesFor(proId, iso) {
  const wd = parseISO_(iso).getDay();
  return GRADES.filter(g => g.pro === proId && g.days.includes(wd));
}
function parseISO_(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
const _hm = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
// bloco ativo no horário hhmm
function gradeAt(proId, iso, hhmm) {
  const mins = _hm(hhmm);
  return gradesFor(proId, iso).find(g => mins >= _hm(g.start) && mins < _hm(g.end)) || null;
}
// duração padrão: tempo do procedimento OU, se não houver, o intervalo da grade
function gradeSlotAt(proId, iso, hhmm) { const g = gradeAt(proId, iso, hhmm); return g ? g.slotMin : 30; }
// sala da grade ativa no horário (null se a grade não define sala)
function gradeRoomAt(proId, iso, hhmm) { const g = gradeAt(proId, iso, hhmm); return g ? (g.room || null) : null; }
// salas distintas que o profissional usa nesse dia (pelas grades)
function proRoomsOn(proId, iso) { return [...new Set(gradesFor(proId, iso).map(g => g.room).filter(Boolean))]; }
// a grade aceita esse procedimento / convênio?
function gradeAccepts(g, { procId, conv } = {}) {
  if (!g) return false;
  if (procId && g.procs && !g.procs.includes(procId)) return false;
  if (conv && g.convenios && !g.convenios.includes(conv)) return false;
  return true;
}
// algum bloco do dia aceita a condição (proc/convênio)?
function dayAcceptsCond(proId, iso, cond) { return gradesFor(proId, iso).some(g => gradeAccepts(g, cond)); }

// ---- Procedures (drive duration, type color, base price) --------------------
const PROCS = {
  derm:   { id: 'derm',   name: 'Consulta Dermatologia',  type: 'consulta',     dur: 30, price: 250 },
  orto:   { id: 'orto',   name: 'Consulta Ortopedia',     type: 'consulta',     dur: 30, price: 280 },
  cardio: { id: 'cardio', name: 'Consulta Cardiologia',   type: 'consulta',     dur: 40, price: 350 },
  clinico:{ id: 'clinico',name: 'Consulta Clínico Geral', type: 'consulta',     dur: 30, price: 200 },
  pedia:  { id: 'pedia',  name: 'Consulta Pediatria',     type: 'consulta',     dur: 30, price: 220 },
  retorno:{ id: 'retorno',name: 'Retorno',                type: 'retorno',      dur: 15, price: 0   },
  ecg:    { id: 'ecg',    name: 'Eletrocardiograma',      type: 'exame',        dur: 20, price: 120, reqEquip: 'e2' },
  usg:    { id: 'usg',    name: 'Ultrassonografia',       type: 'exame',        dur: 30, price: 180, reqEquip: 'e1' },
  mapa:   { id: 'mapa',   name: 'Mapeamento de pele',     type: 'procedimento', dur: 45, price: 400 },
  infil:  { id: 'infil',  name: 'Infiltração',            type: 'procedimento', dur: 30, price: 350 },
  vacina: { id: 'vacina', name: 'Vacinação',              type: 'procedimento', dur: 15, price: 90  },
  tele:   { id: 'tele',   name: 'Teleconsulta',           type: 'telemedicina', dur: 20, price: 150 },
};
const PROC_LIST = Object.values(PROCS);

const CONVENIOS = ['Particular', 'Unimed', 'Amil', 'Bradesco Saúde', 'SulAmérica'];
const UNITS = ['Unidade Centro', 'Unidade Zona Sul'];
const CHANNELS = ['Telefone', 'WhatsApp', 'Balcão', 'Portal do paciente', 'Indicação'];

// ---- Patients ---------------------------------------------------------------
// priority: campo de Prioridade do cadastro (Cardíaco, Criança de colo, etc.)
const PRIORITIES = {
  cardiaco:     { label: 'Cardíaco',                icon: 'heart-pulse' },
  crianca_colo: { label: 'Criança de colo',         icon: 'baby' },
  lactante:     { label: 'Lactante',                icon: 'baby' },
  deficiencia:  { label: 'Portador de deficiência', icon: 'accessibility' },
  obeso:        { label: 'Obeso',                   icon: 'user-round' },
  idoso:        { label: 'Idoso 60+',               icon: 'person-standing' },
  gestante:     { label: 'Gestante',                icon: 'baby' },
};
const PATIENTS = [
  { id: 'pt1',  name: 'Ana Beatriz Oliveira',   phone: '(11) 98472-1130', birth: '1989-03-12', conv: 'Unimed' },
  { id: 'pt2',  name: 'Carlos Eduardo Lima',    phone: '(11) 99641-8820', birth: '1976-11-02', conv: 'Particular' },
  { id: 'pt3',  name: 'Mariana Silva Costa',    phone: '(11) 98155-3074', birth: '1994-07-28', conv: 'Bradesco Saúde' },
  { id: 'pt4',  name: 'Larissa Gomes',          phone: '(11) 99022-6651', birth: '2001-01-19', conv: 'Amil', firstVisit: true },
  { id: 'pt5',  name: 'Pedro Henrique Souza',   phone: '(11) 98890-4417', birth: '1985-09-05', conv: 'Particular' },
  { id: 'pt6',  name: 'Helena Martins',         phone: '(11) 97441-2208', birth: '1968-05-23', conv: 'Unimed', priority: 'idoso' },
  { id: 'pt7',  name: 'Marcos Vinícius Rocha',  phone: '(11) 99513-7762', birth: '1991-12-14', conv: 'SulAmérica' },
  { id: 'pt8',  name: 'Fernanda Dias',          phone: '(11) 98033-5519', birth: '1983-08-30', conv: 'Particular' },
  { id: 'pt9',  name: 'Rafael Almeida',         phone: '(11) 99720-1184', birth: '1979-02-08', conv: 'Amil' },
  { id: 'pt10', name: 'Thiago Barbosa',         phone: '(11) 98266-9043', birth: '1996-10-17', conv: 'Particular', firstVisit: true },
  { id: 'pt11', name: 'Gustavo Carvalho',       phone: '(11) 99388-7251', birth: '1972-04-26', conv: 'Unimed' },
  { id: 'pt12', name: 'Juliana Ferreira',       phone: '(11) 98612-3390', birth: '1990-06-11', conv: 'Particular' },
  { id: 'pt13', name: 'Patrícia Nunes',         phone: '(11) 97155-8806', birth: '1987-09-21', conv: 'Bradesco Saúde' },
  { id: 'pt14', name: 'Lucas Pereira Ramos',    phone: '(11) 99841-2237', birth: '2018-03-03', conv: 'Unimed', priority: 'crianca_colo' },
  { id: 'pt15', name: 'Sofia Cardoso',          phone: '(11) 98477-6610', birth: '2020-11-09', conv: 'Particular', firstVisit: true },
  { id: 'pt16', name: 'Eduardo Nogueira',       phone: '(11) 99230-4471', birth: '1959-07-15', conv: 'Amil', priority: 'cardiaco' },
];
const patientById = id => PATIENTS.find(p => p.id === id);

// ---- Appointments (busy realistic day) --------------------------------------
// a = { id, pro, pt, proc, start("HH:MM"), status, conv, plano(bool), date, fitIn, note, equip, channel }
let _id = 0;
const A = (pro, pt, proc, start, status, conv, opts = {}) => {
  _id++;
  // proc pode ser id único OU array de ids (várias num mesmo agendamento)
  const ids = Array.isArray(proc) ? proc : [proc];
  const procedure = PROCS[ids[0]];
  const sumDur = ids.reduce((s, id) => s + ((PROCS[id] || {}).dur || 0), 0);
  const sumPrice = ids.reduce((s, id) => s + ((PROCS[id] || {}).price || 0), 0);
  return {
    id: 'a' + _id, pro, pt, proc: ids[0], procs: ids, start, status,
    conv: conv || (patientById(pt) || {}).conv || 'Particular',
    plano: conv !== 'Particular' && conv !== undefined ? true : ((patientById(pt) || {}).conv !== 'Particular'),
    date: opts.date || TODAY,
    dur: opts.dur || sumDur || procedure.dur,
    price: opts.price != null ? opts.price : sumPrice,
    fitIn: !!opts.fitIn, note: opts.note || null, equip: opts.equip || null,
    channel: opts.channel || 'Telefone', room: opts.room || null,
    reason: opts.reason || null,
  };
};

// ---- Blocks (out-of-office) — modelo conforme SPEC-Bloqueio-Agenda ----------
// Campos: scope ('pro'|'multi'|'clinica'|'equip') · pro · pros[] · units[]
//  · date (DataDe) · dateEnd (DataA) · start/end (HoraDe/HoraA) · allDay
//  · diasSemana[] (recorrência JS 0=dom..6=sáb, só dentro do range)
//  · titulo · descricao · tipo ('manual'|'grade'|'feriado'|'herdado')
function _genBlocks() {
  const out = [];
  let n = 0;
  const B = o => { n++; out.push({ id: 'b' + n, units: ['Unidade Centro'], scope: 'pro', tipo: 'manual', ...o }); };
  _monthDates().forEach(iso => {
    const wd = parseISO_(iso).getDay();
    if (wd === 0 || wd === 6) return;                       // seg–sex
    B({ pro: 'p1', start: '12:00', end: '13:00', date: iso, titulo: 'Almoço' });
    if (wd === 2 || wd === 4) B({ pro: 'p3', start: '12:30', end: '14:00', date: iso, titulo: 'Reunião clínica', descricao: 'Alinhamento da equipe de cardiologia.' });
  });
  // hoje: cirurgia do Dr. Bruno
  B({ pro: 'p2', start: '11:30', end: '13:30', date: TODAY, titulo: 'Cirurgia (centro)' });
  // recorrente (ter/qui) nesta semana — Dr. Felipe
  B({ pro: 'p4', start: '15:00', end: '15:30', date: WEEK_START, dateEnd: _isoOf(new Date(_MON_D.getTime() + 5 * 86400000)), diasSemana: [2, 4], titulo: 'Reunião de equipe' });
  // feriado da clínica (dia inteiro) — 3ª sexta-feira do mês
  const y = _TODAY_D.getFullYear(), m = _TODAY_D.getMonth();
  const hol = new Date(y, m, 1);
  while (hol.getDay() !== 5) hol.setDate(hol.getDate() + 1);
  hol.setDate(hol.getDate() + 14);
  if (hol.getMonth() !== m) hol.setDate(hol.getDate() - 7);
  B({ scope: 'clinica', pro: 0, units: [], start: '00:00', end: '23:59', date: _isoOf(hol), titulo: 'Feriado — clínica fechada', tipo: 'feriado', allDay: true });
  return out;
}
const SEED_BLOCKS = _genBlocks();
// um bloqueio se aplica a uma data?
function blockOnDate(b, iso) {
  if (b.diasSemana && b.diasSemana.length) {
    if (iso < b.date || iso > (b.dateEnd || b.date)) return false;
    return b.diasSemana.includes(parseISO_(iso).getDay());
  }
  if (b.dateEnd) return iso >= b.date && iso <= b.dateEnd;
  return iso === b.date;
}
// o bloqueio cobre este profissional?
function blockCoversPro(b, proId) {
  if (b.scope === 'clinica') return true;
  if (b.scope === 'multi') return (b.pros || []).includes(proId);
  return b.pro === proId;
}
const DOW_ABBR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function recurLabel(b) {
  if (!b.diasSemana || !b.diasSemana.length) return null;
  const d = [...b.diasSemana].sort((a, c) => a - c);
  // contíguo? mostra intervalo
  const isRange = d.length > 2 && d.every((v, i) => i === 0 || v === d[i - 1] + 1);
  return isRange ? `${DOW_ABBR[d[0]]}–${DOW_ABBR[d[d.length - 1]]}` : d.map(x => DOW_ABBR[x]).join(', ');
}
// editabilidade conforme tipo (SPEC §5/§6)
function blockEditable(b) {
  if (b.tipo === 'grade') return { edit: false, del: false, note: 'Este bloqueio é um intervalo de grade e não pode ser excluído pela agenda.' };
  if (b.tipo === 'herdado') return { edit: false, del: false, note: 'Bloqueio herdado da matriz — somente leitura nesta unidade.' };
  if (b.tipo === 'feriado') return { edit: true, del: true, confirm: true, note: 'Bloqueio gerado a partir de um feriado.' };
  return { edit: true, del: true };
}

// ---- Geração de agendamentos para o mês inteiro -----------------------------
// Percorre a grade de cada profissional em cada dia útil do mês atual e ocupa
// parte dos horários de forma determinística, deixando lacunas como horários
// livres. O status é derivado da data/horário em relação ao "agora" real:
// dias passados → finalizado/faltou; hoje → segue o relógio; futuros → marcado.
function _monthDates() {
  const y = _TODAY_D.getFullYear(), m = _TODAY_D.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const out = [];
  for (let d = 1; d <= last; d++) out.push(_isoOf(new Date(y, m, d)));
  return out;
}
function _statusFor(iso, startMin, dur, seed) {
  if (iso < TODAY) { const r = seed % 12; return r === 0 ? 'faltou' : r === 1 ? 'cancelado' : 'finalizado'; }
  if (iso > TODAY) { return seed % 3 === 0 ? 'confirmado' : 'marcado'; }
  // hoje — relativo ao horário real de abertura
  if (startMin + dur <= NOW_MIN_D) return seed % 9 === 0 ? 'faltou' : 'finalizado';
  if (startMin <= NOW_MIN_D) return seed % 2 === 0 ? 'em_atendimento' : 'aguardando';
  if (startMin - NOW_MIN_D <= 90) return 'confirmado';
  return seed % 3 === 0 ? 'confirmado' : 'marcado';
}
function _genMonthAppts() {
  const out = [];
  _monthDates().forEach(iso => {
    PROS.forEach(pro => {
      gradesFor(pro.id, iso).forEach(g => {
        const step = g.slotMin || 30;
        const procs = (g.procs && g.procs.length) ? g.procs : ['retorno'];
        for (let s = _hm(g.start); s + step <= _hm(g.end); s += step) {
          if ((g.intervals || []).some(iv => s >= _hm(iv.start) && s < _hm(iv.end))) continue;
          const hhmm = fmtMin(s);
          const seed = _nseed(iso + pro.id + hhmm);
          if (seed % 100 >= 48) continue;                    // ~48% ocupação → sobram horários livres
          const procId = procs[seed % procs.length];
          const proc = PROCS[procId] || {};
          const pt = PATIENTS[(seed >>> 3) % PATIENTS.length].id;
          const conv = g.convenios ? g.convenios[seed % g.convenios.length] : undefined;
          const opts = { date: iso };
          if (proc.reqEquip) opts.equip = proc.reqEquip;
          out.push(A(pro.id, pt, procId, hhmm, _statusFor(iso, s, proc.dur || step, seed), conv, opts));
        }
      });
    });
  });
  return out;
}
// Alguns casos "ricos" no dia de hoje: multi-procedimento e encaixes.
function _todayFlavor() {
  const mk = (pro, pt, proc, start, conv, opts = {}) => {
    const ids = Array.isArray(proc) ? proc : [proc];
    const dur = opts.dur || ids.reduce((a, id) => a + ((PROCS[id] || {}).dur || 0), 0);
    const seed = _nseed('flav' + pro + start);
    return A(pro, pt, proc, start, _statusFor(TODAY, _hm(start), dur, seed), conv, { date: TODAY, ...opts });
  };
  return [
    mk('p1', 'pt3', ['derm', 'mapa'], '09:30', 'Particular'),
    mk('p3', 'pt5', ['cardio', 'ecg', 'retorno'], '10:30', 'Particular'),
    mk('p2', 'pt16', 'retorno', '14:30', 'Amil', { fitIn: true, reason: 'Encaixe — dor aguda' }),
    mk('p1', 'pt5', 'retorno', '10:30', 'Particular', { fitIn: true, reason: 'Encaixe — paciente em viagem' }),
  ];
}

const ALL_APPTS = _genMonthAppts().concat(_todayFlavor());

// ---- Multi-procedure helpers ------------------------------------------------
const apptProcIds = a => (a.procs && a.procs.length ? a.procs : [a.proc]);
const apptProcList = a => apptProcIds(a).map(id => PROCS[id]).filter(Boolean);
const apptDurSum = a => apptProcIds(a).reduce((s, id) => s + ((PROCS[id] || {}).dur || 0), 0);
const apptPriceSum = a => apptProcIds(a).reduce((s, id) => s + ((PROCS[id] || {}).price || 0), 0);
function apptProcLabel(a) {
  const list = apptProcList(a);
  if (list.length <= 1) return (list[0] || {}).name || '';
  return `${list[0].name} +${list.length - 1}`;
}

// ---- Clinic required-fields config presets (spec §10.2) ---------------------
const PATIENT_FIELDS = {
  Nascimento: 'Data de nascimento', Sexo: 'Sexo', Profissao: 'Profissão', Documento: 'Documento (RG)',
  Origem: 'Origem (como chegou)', Email1: 'E-mail', CPF: 'CPF', Pendencias: 'Pendências',
  IndicadoPor: 'Indicado por', IndicadoPorSelecao: 'Indicado por (profissional)', Matricula1: 'Matrícula / carteirinha',
  NomeSocial: 'Nome social', Cel1: 'Celular', Tel1: 'Telefone fixo', Tabela: 'Tabela particular',
};

const CLINIC_CONFIGS = {
  padrao: {
    label: 'Clínica Padrão',
    desc: 'Configuração mínima — só o essencial.',
    paciente: { obrigar: [], exibir: [] },
    agendamento: { obrigar: ['Cel1'], exibir: [] },
  },
  exigente: {
    label: 'Clínica Exigente (mais campos)',
    desc: 'Exige nascimento, origem, carteirinha e CPF; exibe sexo e profissão.',
    paciente: { obrigar: ['Nascimento', 'Origem', 'Matricula1', 'CPF'], exibir: ['Sexo', 'Profissao', 'Documento'] },
    agendamento: { obrigar: ['Tel1', 'Cel1', 'Email1', 'Tabela'], exibir: ['Origem', 'IndicadoPorSelecao'] },
  },
  convenio: {
    label: 'Operadora / Convênio',
    desc: 'Foco em dados de plano: carteirinha e nascimento obrigatórios.',
    paciente: { obrigar: ['Matricula1', 'Nascimento'], exibir: ['Documento'] },
    agendamento: { obrigar: ['Cel1', 'Email1'], exibir: ['IndicadoPorSelecao'] },
  },
};

// ---- Notificações ao paciente (eventos de confirmação de agenda) ------------
// "Agora" (NOW_DT) = horário real de abertura, definido no topo do arquivo.
const NOTIF_CHANNELS = {
  whatsapp: { label: 'WhatsApp', icon: 'message-circle', color: '#1f8a4c' },
  sms:      { label: 'SMS',      icon: 'smartphone',     color: '#1b5ea9' },
  email:    { label: 'E-mail',   icon: 'mail',           color: '#865200' },
};
// received=true → conta como "recebida" no resumo do card
const NOTIF_STATUS = {
  respondida: { label: 'Confirmou presença', badge: 'success', icon: 'check-check',     received: true },
  lida:       { label: 'Lida',               badge: 'success', icon: 'check-check',     received: true },
  entregue:   { label: 'Entregue',           badge: 'info',    icon: 'check',           received: true },
  enviada:    { label: 'Enviada',            badge: 'neutral', icon: 'send',            received: false },
  agendada:   { label: 'Agendada',           badge: 'neutral', icon: 'clock',           received: false },
  falhou:     { label: 'Falha no envio',     badge: 'danger',  icon: 'alert-triangle',  received: false },
};
// modelos de evento. before = minutos antes do início; post = após o fim.
const NOTIF_DEFS = [
  { key: 'criacao',     label: 'Confirmação de agendamento', before: 3 * 1440 }, // ~3 dias antes
  { key: 'lembrete',    label: 'Lembrete da consulta',        before: 1440 },     // 24h antes
  { key: 'confirmacao', label: 'Pedido de confirmação',       before: 1320 },     // véspera, ~22h antes
  { key: 'diadia',      label: 'Lembrete no dia',             before: 120 },      // 2h antes
  { key: 'pesquisa',    label: 'Pesquisa de satisfação',      post: true },        // 1h após o fim
];
function _nseed(str) { let h = 0; for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) >>> 0; return h; }
function apptDateTime(a) { const [y, mo, d] = a.date.split('-').map(Number); const m = toMin(a.start); return new Date(y, mo - 1, d, Math.floor(m / 60), m % 60); }
// canal preferido do paciente (determinístico): maioria WhatsApp, alguns SMS/e-mail
function apptChannel(a) { const s = _nseed(a.pt) % 10; return s < 6 ? 'whatsapp' : s < 8 ? 'sms' : 'email'; }

// gera a lista de notificações de um agendamento (status derivado do estado + do "agora")
function apptNotifications(a) {
  if (!a) return [];
  const seed = _nseed(a.id);
  const start = apptDateTime(a);
  const endDT = new Date(start.getTime() + (a.dur || 30) * 60000);
  const ch = apptChannel(a);
  const out = [];
  if (a.status === 'cancelado') {
    const sentAt = new Date(NOW_DT.getTime() - 35 * 60000);
    out.push({ key: 'cancelamento', label: 'Aviso de cancelamento', channel: ch, status: 'entregue', at: sentAt, scheduledFor: sentAt });
  }
  NOTIF_DEFS.forEach((def, i) => {
    if (def.key === 'pesquisa' && a.status !== 'finalizado') return;       // só após atendimento
    if (a.status === 'cancelado' && def.key !== 'criacao') return;        // cancelado: sem lembretes futuros
    const sendDT = def.post ? new Date(endDT.getTime() + 60 * 60000) : new Date(start.getTime() - def.before * 60000);
    let status, at = null;
    if (sendDT > NOW_DT) { status = 'agendada'; }
    else {
      const delivered = new Date(sendDT.getTime() + (1 + (seed % 4)) * 60000);
      if (ch === 'email' && def.key === 'lembrete' && seed % 7 === 0) { status = 'falhou'; at = sendDT; }
      else if (def.key === 'confirmacao') {
        if (['confirmado', 'aguardando', 'em_atendimento', 'finalizado'].includes(a.status)) { status = 'respondida'; at = new Date(delivered.getTime() + (5 + (seed % 40)) * 60000); }
        else { status = 'entregue'; at = delivered; }
      } else { status = (seed + i) % 3 === 0 ? 'entregue' : 'lida'; at = delivered; }
    }
    out.push({ key: def.key, label: def.label, channel: ch, status, at, scheduledFor: sendDT });
  });
  return out.sort((x, y) => x.scheduledFor - y.scheduledFor);
}
function notifSummary(a) {
  const list = apptNotifications(a);
  let sent = 0, received = 0, scheduled = 0, failed = 0, replied = 0, lastReceived = null;
  list.forEach(n => {
    const meta = NOTIF_STATUS[n.status] || {};
    if (n.status === 'agendada') scheduled++; else sent++;
    if (n.status === 'falhou') failed++;
    if (meta.received) { received++; if (n.at && (!lastReceived || n.at > lastReceived)) lastReceived = n.at; }
    if (n.status === 'respondida') replied++;
  });
  return { total: list.length, sent, received, scheduled, failed, replied, lastReceived, confirmed: replied > 0 };
}
// data/hora amigável relativa ao "agora": "hoje · 09:45", "ontem · 18:00", "16 jun · 08:30"
function fmtNotifWhen(d) {
  if (!d) return '';
  const sd = (x, y) => x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
  const day = 86400000;
  let pfx;
  if (sd(d, NOW_DT)) pfx = 'hoje';
  else if (sd(d, new Date(NOW_DT.getTime() - day))) pfx = 'ontem';
  else if (sd(d, new Date(NOW_DT.getTime() + day))) pfx = 'amanhã';
  else pfx = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return `${pfx} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

Object.assign(window, {
  TODAY, WEEK_START, PROS, specsOf, specLabel, proHasSpec, EQUIP, ROOMS, effectiveRoom, roomShort, GRADES, gradesFor, gradeAt, gradeSlotAt, gradeRoomAt, proRoomsOn, gradeAccepts, dayAcceptsCond, PROCS, PROC_LIST, CONVENIOS, UNITS, CHANNELS,
  PATIENTS, patientById, ALL_APPTS, SEED_BLOCKS, blockOnDate, blockCoversPro, recurLabel, blockEditable, DOW_ABBR, PATIENT_FIELDS, CLINIC_CONFIGS, PRIORITIES,
  apptProcIds, apptProcList, apptDurSum, apptPriceSum, apptProcLabel,
  NOTIF_CHANNELS, NOTIF_STATUS, apptNotifications, notifSummary, fmtNotifWhen,
});
