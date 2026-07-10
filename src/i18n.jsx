/* ============================================================================
   Feegow — New Agenda · Demo i18n (PT → EN)
   Camada de tradução APENAS PARA DEMONSTRAÇÃO. Reescreve os nós de texto e
   atributos (placeholder/title/aria-label) do DOM sob #root a partir de um
   dicionário curado. Não é i18n de produção — é um "verniz" para demos a
   clientes internacionais, acionado pelo Tweak de idioma.
   ============================================================================ */

// Frases inteiras (match exato do texto, após trim). Aplicadas antes dos termos.
const I18N_PHRASES = {
  // chrome / navbar
  'Menu': 'Menu', 'Cadastros': 'Records', 'Configurações': 'Settings', 'Ligações': 'Calls',
  'Mensagens': 'Messages', 'Tarefas': 'Tasks', 'Notificações': 'Notifications', 'Chat': 'Chat',
  'Ajuda': 'Help', 'Mostrar agendas no topo': 'Show schedules on top',
  'Mostrar agendas na barra lateral': 'Show schedules in the sidebar',
  // create menu
  'Consulta, exame ou retorno': 'Appointment, exam or follow-up',
  'Sobrepõe um horário ocupado': 'Overlaps a busy slot',
  'Almoço, reunião, ausência': 'Lunch, meeting, absence',
  // sidebar
  'Status do agendamento': 'Appointment status',
  // toolbar filters
  'Somente horários livres': 'Free slots only',
  'Adicionar agenda': 'Add schedule', 'Adicionar recurso': 'Add resource',
  'Selecionar todos': 'Select all',
  // cancel modal
  'Motivo do cancelamento': 'Cancellation reason',
  'O motivo fica registrado no histórico e o horário é liberado.':
    'The reason is logged in the history and the slot is released.',
  'Profissional indisponível': 'Professional unavailable',
  'Reagendamento interno': 'Internal rescheduling',
  'Equipamento em manutenção': 'Equipment under maintenance',
  'Erro de marcação': 'Booking error',
  'Paciente desmarcou': 'Patient cancelled',
  'Paciente faltou': 'Patient no-show',
  'Imprevisto pessoal': 'Personal emergency',
  'Convênio não autorizado': 'Insurance not authorized',
  // reschedule
  'Dica: você também pode arrastar o card direto para o novo horário.':
    'Tip: you can also drag the card straight to the new slot.',
  // block modal
  'Clínica inteira (todas as agendas)': 'Entire clinic (all schedules)',
  'Limpar recorrência': 'Clear recurrence',
  'Defina a data fim para repetir ao longo das semanas.':
    'Set the end date to repeat across weeks.',
  'Você está editando um bloqueio gerado a partir de um feriado. Confirme para aplicar.':
    'You are editing a block generated from a holiday. Confirm to apply.',
  'Ninguém aguardando no momento.': 'No one waiting right now.',
  // drag-and-drop validation
  'Convênio não atendido': 'Insurance not accepted',
  'Serviço não oferecido': 'Service not offered',
  'Escolha outro profissional ou ajuste o convênio do agendamento.': 'Choose another professional or adjust the appointment insurance.',
  'Escolha um profissional que ofereça esse serviço.': 'Choose a professional who offers this service.',
  // waiting / misc
  'Sala de espera': 'Waiting room',
};

// Termos / substrings (PT → EN). Aplicados após as frases, do mais longo p/ o mais
// curto (evita que um termo curto quebre um composto). Case-sensitive.
const I18N_TERMS = {
  // modules
  'Espera': 'Waiting', 'Pacientes': 'Patients', 'Estoque': 'Inventory',
  'Financeiro': 'Finance', 'Faturamento': 'Billing', 'Relatórios': 'Reports',
  // views / toolbar
  'Hoje': 'Today', 'Semana': 'Week', 'Mês': 'Month', 'Equipamentos': 'Equipment',
  'Programação': 'Overview', 'Filtros': 'Filters', 'Filtro': 'Filter',
  // create / actions
  'Criar': 'Create', 'Recolher': 'Collapse', 'Novo': 'New', 'Entendi': 'Got it',
  'não atende o convênio': 'does not accept the insurance', 'não realiza': 'does not perform',
  'Almoço': 'Lunch', 'Reunião clínica': 'Clinical meeting', 'Reunião': 'Meeting',
  'Cirurgia': 'Surgery', 'Férias': 'Vacation', 'Ausência': 'Absence', 'Intervalo': 'Break',
  'Agendamento': 'Appointment', 'agendamento': 'appointment',
  'Encaixe': 'Fit-in', 'Bloqueios neste horário': 'Blocks at this time',
  'Novo bloqueio': 'New block', 'Bloqueio': 'Block', 'Bloquear': 'Block',
  // sidebar / search
  'Buscar paciente, agendamento…': 'Search patient, appointment…',
  'Buscar profissional, especialidade, convênio, unidade, sala…':
    'Search professional, specialty, insurance, unit, room…',
  'Buscar e adicionar procedimento…': 'Search and add procedure…',
  'Digite para buscar o procedimento…': 'Type to search the procedure…',
  'Buscar paciente…': 'Search patient…', 'Buscar': 'Search',
  'Refine a busca para ver mais resultados': 'Refine the search to see more results',
  'Fase 2': 'Phase 2',
  // agendas selector
  'Agendas:': 'Schedules:', 'Agendas': 'Schedules', 'Agenda': 'Schedule',
  // filter section titles
  'Profissionais': 'Professionals', 'Profissional': 'Professional',
  'Especialidade': 'Specialty', 'Convênios': 'Insurances', 'Convênio': 'Insurance',
  'Unidades': 'Units', 'Unidade': 'Unit', 'Salas': 'Rooms',
  'Selecionar': 'Select', 'Limpar': 'Clear',
  // booking phrases
  'Cancelar agendamento': 'Cancel appointment',
  'Remarcar agendamento': 'Reschedule appointment',
  'Confirmar cancelamento': 'Confirm cancellation',
  'Confirmar edição': 'Confirm edit',
  'Novo horário': 'New time', 'Novo paciente': 'New patient',
  'Nenhum paciente encontrado.': 'No patients found.',
  'Nenhum procedimento encontrado.': 'No procedures found.',
  // block modal fields
  'Data início': 'Start date', 'Data fim': 'End date',
  'Motivo / título': 'Reason / title', 'Observação (opcional)': 'Note (optional)',
  'Dia inteiro': 'All day', 'Recorrência': 'Recurrence', 'Aplica-se a': 'Applies to',
  'Justificativa': 'Reason', 'Por paciente': 'By patient', 'Pela clínica': 'By clinic',
  'dias da semana, dentro do período': 'days of the week, within the period',
  // procedures (full — vêm antes de "Consulta")
  'Consulta Dermatologia': 'Dermatology consultation',
  'Consulta Ortopedia': 'Orthopedics consultation',
  'Consulta Cardiologia': 'Cardiology consultation',
  'Consulta Clínico Geral': 'General practice consultation',
  'Consulta Pediatria': 'Pediatrics consultation',
  'Eletrocardiograma': 'Electrocardiogram', 'Eletrocardiógrafo': 'Electrocardiograph',
  'Ultrassonografia': 'Ultrasound', 'Mapeamento de pele': 'Skin mapping',
  'Infiltração': 'Injection', 'Vacinação': 'Vaccination', 'Teleconsulta': 'Teleconsultation',
  // rooms / equipment
  'Sala de Procedimentos': 'Procedure Room', 'Sala de Ultrassom': 'Ultrasound Room',
  'Sala de Exames': 'Exam Room', 'Consultório': 'Office',
  // specialties
  'Dermatologia': 'Dermatology', 'Tricologia': 'Trichology', 'Ortopedia': 'Orthopedics',
  'Traumatologia': 'Traumatology', 'Medicina Esportiva': 'Sports Medicine',
  'Cardiologia': 'Cardiology', 'Clínico Geral': 'General Practice',
  'Clínica geral': 'General practice', 'Pediatria': 'Pediatrics',
  'Procedimentos': 'Procedures', 'Imagem': 'Imaging',
  // appointment types / statuses
  'Em atendimento': 'In progress', 'Telemedicina': 'Telemedicine',
  'Consulta': 'Consultation', 'Retorno': 'Follow-up', 'Exame': 'Exam',
  'Procedimento': 'Procedure',
  'Marcado': 'Scheduled', 'Confirmado': 'Confirmed', 'Aguardando': 'Waiting',
  'Finalizado': 'Completed', 'Faltou': 'No-show', 'Cancelado': 'Cancelled',
  'Confirm.': 'Confirm.', 'Aguard.': 'Waiting', 'Atend.': 'In prog.',
  'Final.': 'Done', 'Cancel.': 'Cancelled',
  // convênios
  'Particular': 'Private',
  // doctoralia / availability
  'Disponível em Doctoralia': 'Available on Doctoralia', 'Disponível': 'Available',
  // card badges
  '1ª vez': '1st visit', 'novo': 'new',
  'procedimentos': 'procedures', 'procedimento': 'procedure',
  // waiting-list bits
  'em atendimento': 'in progress', 'min de espera': 'min waiting',
  // generic buttons / labels
  'Voltar': 'Back', 'Fechar': 'Close', 'Salvar': 'Save', 'Cancelar': 'Cancel',
  'Excluir': 'Delete', 'Confirmar': 'Confirm', 'Chamar': 'Call', 'Finalizar': 'Finish',
  'Paciente': 'Patient', 'Horário': 'Time', 'Início': 'Start', 'Fim': 'End',
  'Unidades': 'Units', 'Data': 'Date', 'Dia': 'Day', 'Salas': 'Rooms', 'Sala': 'Room',
  'Clínica inteira': 'Entire clinic', 'Livre': 'Free',
  // dates — weekdays (lowercase, header usa capitalize via CSS)
  'domingo': 'Sunday', 'segunda': 'Monday', 'terça': 'Tuesday', 'quarta': 'Wednesday',
  'quinta': 'Thursday', 'sexta': 'Friday', 'sábado': 'Saturday',
  // months (lowercase)
  'janeiro': 'January', 'fevereiro': 'February', 'março': 'March', 'abril': 'April',
  'maio': 'May', 'junho': 'June', 'julho': 'July', 'agosto': 'August',
  'setembro': 'September', 'outubro': 'October', 'novembro': 'November', 'dezembro': 'December',
  // short months that differ from EN
  'fev': 'Feb', 'abr': 'Apr', 'ago': 'Aug', 'set': 'Sep', 'out': 'Oct', 'dez': 'Dec',
  // "de" no cabeçalho de data ("10 de julho" → "10 July")
  ' de ': ' ',
};

// termos ordenados do mais longo p/ o mais curto
const I18N_TERM_KEYS = Object.keys(I18N_TERMS).sort((a, b) => b.length - a.length);

// regex por termo, com fronteiras de palavra Unicode: o termo só é trocado quando
// não está colado a outra letra (evita "Dias"→"Days", "email"→…, etc.).
const I18N_RE_CACHE = {};
function i18nRegex(term) {
  if (I18N_RE_CACHE[term]) return I18N_RE_CACHE[term];
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startsAlpha = /[\p{L}\p{N}]/u.test(term[0]);
  const endsAlpha = /[\p{L}\p{N}]/u.test(term[term.length - 1]);
  const pre = startsAlpha ? '(?<![\\p{L}\\p{N}])' : '';
  const post = endsAlpha ? '(?![\\p{L}\\p{N}])' : '';
  const re = new RegExp(pre + esc + post, 'gu');
  I18N_RE_CACHE[term] = re;
  return re;
}

function i18nApply(str) {
  if (!str) return str;
  const trimmed = str.trim();
  if (Object.prototype.hasOwnProperty.call(I18N_PHRASES, trimmed)) {
    return str.replace(trimmed, I18N_PHRASES[trimmed]);
  }
  let out = str;
  for (const k of I18N_TERM_KEYS) {
    if (out.indexOf(k) !== -1) out = out.replace(i18nRegex(k), I18N_TERMS[k]);
  }
  return out;
}

// ── Motor de tradução do DOM ────────────────────────────────────────────────
const I18N = (() => {
  const originalsText = new WeakMap();   // Text node → PT original
  const originalsAttr = new WeakMap();   // Element → { attr: ptOriginal }
  const touchedText = new Set();
  const touchedAttr = new Set();
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  let observer = null;
  let active = false;
  let busy = false;

  function translateTextNode(node) {
    const cur = node.nodeValue;
    if (!cur || !cur.trim()) return;
    if (!originalsText.has(node)) originalsText.set(node, cur);
    const src = originalsText.get(node);
    const next = i18nApply(src);
    if (next !== node.nodeValue) node.nodeValue = next;
    touchedText.add(node);
  }

  function translateAttrs(el) {
    for (const attr of ATTRS) {
      if (!el.hasAttribute || !el.hasAttribute(attr)) continue;
      const cur = el.getAttribute(attr);
      if (!cur || !cur.trim()) continue;
      let rec = originalsAttr.get(el);
      if (!rec) { rec = {}; originalsAttr.set(el, rec); }
      if (!(attr in rec)) rec[attr] = cur;
      const next = i18nApply(rec[attr]);
      if (next !== cur) el.setAttribute(attr, next);
      touchedAttr.add(el);
    }
  }

  function walk(root) {
    if (!root) return;
    // text nodes
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const texts = [];
    let n; while ((n = tw.nextNode())) texts.push(n);
    texts.forEach(translateTextNode);
    // attributes
    if (root.nodeType === 1) translateAttrs(root);
    const ew = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
    let e; while ((e = ew.nextNode())) translateAttrs(e);
  }

  function translateAll() {
    const root = document.getElementById('root');
    if (!root) return;
    busy = true;
    walk(root);
    busy = false;
  }

  function revertAll() {
    busy = true;
    for (const node of touchedText) {
      if (originalsText.has(node) && node.isConnected) node.nodeValue = originalsText.get(node);
    }
    for (const el of touchedAttr) {
      const rec = originalsAttr.get(el);
      if (rec && el.isConnected) for (const attr in rec) el.setAttribute(attr, rec[attr]);
    }
    touchedText.clear(); touchedAttr.clear();
    busy = false;
  }

  function onMutations(muts) {
    if (busy || !active) return;
    busy = true;
    for (const m of muts) {
      if (m.type === 'characterData') { originalsText.delete(m.target); translateTextNode(m.target); }
      else if (m.type === 'attributes' && m.target.nodeType === 1) { const r = originalsAttr.get(m.target); if (r) delete r[m.attributeName]; translateAttrs(m.target); }
      else m.addedNodes.forEach(node => {
        if (node.nodeType === 3) translateTextNode(node);
        else if (node.nodeType === 1) walk(node);
      });
    }
    busy = false;
  }

  function set(lang) {
    const en = lang === 'en';
    if (en === active) { if (en) translateAll(); return; }
    active = en;
    const root = document.getElementById('root');
    if (en) {
      translateAll();
      observer = new MutationObserver(onMutations);
      if (root) observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    } else {
      if (observer) { observer.disconnect(); observer = null; }
      revertAll();
    }
  }

  return { set };
})();

window.I18N = I18N;
window.i18nApply = i18nApply;
