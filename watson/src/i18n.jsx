/* ============================================================================
   Feegow — New Agenda · Demo i18n (PT → EN / ES / IT)
   Camada de tradução APENAS PARA DEMONSTRAÇÃO. Reescreve os nós de texto e
   atributos (placeholder/title/aria-label) do DOM sob #root a partir de um
   dicionário curado. Não é i18n de produção — é um "verniz" para demos a
   clientes internacionais, acionado pelo Tweak de idioma.
   Cada entrada mapeia o texto PT para { en, es, it }.
   ============================================================================ */

// Frases inteiras (match exato do texto, após trim). Aplicadas antes dos termos.
const I18N_PHRASES = {
  // chrome / navbar
  'Menu': { en: 'Menu', es: 'Menú', it: 'Menu' },
  'Cadastros': { en: 'Records', es: 'Registros', it: 'Anagrafiche' },
  'Configurações': { en: 'Settings', es: 'Configuración', it: 'Impostazioni' },
  'Ligações': { en: 'Calls', es: 'Llamadas', it: 'Chiamate' },
  'Mensagens': { en: 'Messages', es: 'Mensajes', it: 'Messaggi' },
  'Tarefas': { en: 'Tasks', es: 'Tareas', it: 'Attività' },
  'Notificações': { en: 'Notifications', es: 'Notificaciones', it: 'Notifiche' },
  'Chat': { en: 'Chat', es: 'Chat', it: 'Chat' },
  'Ajuda': { en: 'Help', es: 'Ayuda', it: 'Aiuto' },
  'Mostrar agendas no topo': { en: 'Show schedules on top', es: 'Mostrar agendas arriba', it: 'Mostra agende in alto' },
  'Mostrar agendas na barra lateral': { en: 'Show schedules in the sidebar', es: 'Mostrar agendas en la barra lateral', it: 'Mostra agende nella barra laterale' },
  // create menu
  'Consulta, exame ou retorno': { en: 'Appointment, exam or follow-up', es: 'Consulta, examen o revisión', it: 'Visita, esame o controllo' },
  'Sobrepõe um horário ocupado': { en: 'Overlaps a busy slot', es: 'Se superpone a un horario ocupado', it: 'Si sovrappone a un orario occupato' },
  'Almoço, reunião, ausência': { en: 'Lunch, meeting, absence', es: 'Almuerzo, reunión, ausencia', it: 'Pranzo, riunione, assenza' },
  // sidebar
  'Status do agendamento': { en: 'Appointment status', es: 'Estado de la cita', it: 'Stato dell\u2019appuntamento' },
  // toolbar filters
  'Somente horários livres': { en: 'Free slots only', es: 'Solo horarios libres', it: 'Solo orari liberi' },
  'Adicionar agenda': { en: 'Add schedule', es: 'Añadir agenda', it: 'Aggiungi agenda' },
  'Adicionar recurso': { en: 'Add resource', es: 'Añadir recurso', it: 'Aggiungi risorsa' },
  'Selecionar todos': { en: 'Select all', es: 'Seleccionar todos', it: 'Seleziona tutti' },
  // cancel modal
  'Motivo do cancelamento': { en: 'Cancellation reason', es: 'Motivo de la cancelación', it: 'Motivo dell\u2019annullamento' },
  'O motivo fica registrado no histórico e o horário é liberado.':
    { en: 'The reason is logged in the history and the slot is released.', es: 'El motivo queda registrado en el historial y el horario se libera.', it: 'Il motivo viene registrato nello storico e l\u2019orario viene liberato.' },
  'Profissional indisponível': { en: 'Professional unavailable', es: 'Profesional no disponible', it: 'Professionista non disponibile' },
  'Reagendamento interno': { en: 'Internal rescheduling', es: 'Reprogramación interna', it: 'Riprogrammazione interna' },
  'Equipamento em manutenção': { en: 'Equipment under maintenance', es: 'Equipo en mantenimiento', it: 'Attrezzatura in manutenzione' },
  'Erro de marcação': { en: 'Booking error', es: 'Error de reserva', it: 'Errore di prenotazione' },
  'Paciente desmarcou': { en: 'Patient cancelled', es: 'El paciente canceló', it: 'Il paziente ha annullato' },
  'Paciente faltou': { en: 'Patient no-show', es: 'El paciente no asistió', it: 'Paziente assente' },
  'Imprevisto pessoal': { en: 'Personal emergency', es: 'Imprevisto personal', it: 'Imprevisto personale' },
  'Convênio não autorizado': { en: 'Insurance not authorized', es: 'Seguro no autorizado', it: 'Assicurazione non autorizzata' },
  // reschedule
  'Dica: você também pode arrastar o card direto para o novo horário.':
    { en: 'Tip: you can also drag the card straight to the new slot.', es: 'Consejo: también puedes arrastrar la tarjeta directamente al nuevo horario.', it: 'Suggerimento: puoi anche trascinare la scheda direttamente nel nuovo orario.' },
  // block modal
  'Clínica inteira (todas as agendas)': { en: 'Entire clinic (all schedules)', es: 'Clínica entera (todas las agendas)', it: 'Intera clinica (tutte le agende)' },
  'Limpar recorrência': { en: 'Clear recurrence', es: 'Borrar recurrencia', it: 'Cancella ricorrenza' },
  'Defina a data fim para repetir ao longo das semanas.':
    { en: 'Set the end date to repeat across weeks.', es: 'Define la fecha de fin para repetir a lo largo de las semanas.', it: 'Imposta la data di fine per ripetere nelle settimane.' },
  'Você está editando um bloqueio gerado a partir de um feriado. Confirme para aplicar.':
    { en: 'You are editing a block generated from a holiday. Confirm to apply.', es: 'Estás editando un bloqueo generado a partir de un feriado. Confirma para aplicar.', it: 'Stai modificando un blocco generato da una festività. Conferma per applicare.' },
  'Ninguém aguardando no momento.': { en: 'No one waiting right now.', es: 'Nadie esperando en este momento.', it: 'Nessuno in attesa al momento.' },
  // drag-and-drop validation
  'Convênio não atendido': { en: 'Insurance not accepted', es: 'Seguro no aceptado', it: 'Assicurazione non accettata' },
  'Serviço não oferecido': { en: 'Service not offered', es: 'Servicio no ofrecido', it: 'Servizio non offerto' },
  'Escolha outro profissional ou ajuste o convênio do agendamento.': { en: 'Choose another professional or adjust the appointment insurance.', es: 'Elige otro profesional o ajusta el seguro de la cita.', it: 'Scegli un altro professionista o modifica l\u2019assicurazione dell\u2019appuntamento.' },
  'Escolha um profissional que ofereça esse serviço.': { en: 'Choose a professional who offers this service.', es: 'Elige un profesional que ofrezca este servicio.', it: 'Scegli un professionista che offra questo servizio.' },
  // waiting / misc
  'Sala de espera': { en: 'Waiting room', es: 'Sala de espera', it: 'Sala d\u2019attesa' },
};

// Termos / substrings (PT → {en,es,it}). Aplicados após as frases, do mais longo p/ o
// mais curto (evita que um termo curto quebre um composto). Case-sensitive.
const I18N_TERMS = {
  // modules
  'Espera': { en: 'Waiting', es: 'Espera', it: 'Attesa' },
  'Pacientes': { en: 'Patients', es: 'Pacientes', it: 'Pazienti' },
  'Estoque': { en: 'Inventory', es: 'Inventario', it: 'Magazzino' },
  'Financeiro': { en: 'Finance', es: 'Finanzas', it: 'Finanza' },
  'Faturamento': { en: 'Billing', es: 'Facturación', it: 'Fatturazione' },
  'Relatórios': { en: 'Reports', es: 'Informes', it: 'Report' },
  // views / toolbar
  'Hoje': { en: 'Today', es: 'Hoy', it: 'Oggi' },
  'Semana': { en: 'Week', es: 'Semana', it: 'Settimana' },
  'Mês': { en: 'Month', es: 'Mes', it: 'Mese' },
  'Equipamentos': { en: 'Equipment', es: 'Equipos', it: 'Attrezzature' },
  'Programação': { en: 'Overview', es: 'Programación', it: 'Programmazione' },
  'Filtros': { en: 'Filters', es: 'Filtros', it: 'Filtri' },
  'Filtro': { en: 'Filter', es: 'Filtro', it: 'Filtro' },
  // create / actions
  'Criar': { en: 'Create', es: 'Crear', it: 'Crea' },
  'Recolher': { en: 'Collapse', es: 'Contraer', it: 'Comprimi' },
  'Novo': { en: 'New', es: 'Nuevo', it: 'Nuovo' },
  'Entendi': { en: 'Got it', es: 'Entendido', it: 'Ho capito' },
  'Enviada(s), sem confirmação de recebimento': { en: 'Sent, no delivery confirmation', es: 'Enviada(s), sin confirmación de recepción', it: 'Inviata/e, senza conferma di ricezione' },
  'Nenhuma notificação para este agendamento.': { en: 'No notifications for this appointment.', es: 'Sin notificaciones para esta cita.', it: 'Nessuna notifica per questo appuntamento.' },
  'nome@email.com': { en: 'name@email.com', es: 'nombre@email.com', it: 'nome@email.com' },
  'Ocultar fim de semana': { en: 'Hide weekend', es: 'Ocultar fin de semana', it: 'Nascondi weekend' },
  '— escolha o novo horário livre. Você pode trocar de agenda, data e visualização.': { en: '— pick the new free slot. You can switch schedule, date and view.', es: '— elige el nuevo horario libre. Puedes cambiar de agenda, fecha y vista.', it: '— scegli il nuovo orario libero. Puoi cambiare agenda, data e vista.' },
  'Cancelar remarcação': { en: 'Cancel reschedule', es: 'Cancelar reprogramación', it: 'Annulla riprogrammazione' },
  'não atende o convênio': { en: 'does not accept the insurance', es: 'no acepta el seguro', it: 'non accetta l\u2019assicurazione' },
  'não realiza': { en: 'does not perform', es: 'no realiza', it: 'non esegue' },
  'Almoço': { en: 'Lunch', es: 'Almuerzo', it: 'Pranzo' },
  'Reunião clínica': { en: 'Clinical meeting', es: 'Reunión clínica', it: 'Riunione clinica' },
  'Reunião': { en: 'Meeting', es: 'Reunión', it: 'Riunione' },
  'Cirurgia': { en: 'Surgery', es: 'Cirugía', it: 'Chirurgia' },
  'Férias': { en: 'Vacation', es: 'Vacaciones', it: 'Ferie' },
  'Ausência': { en: 'Absence', es: 'Ausencia', it: 'Assenza' },
  'Intervalo': { en: 'Break', es: 'Descanso', it: 'Pausa' },
  'Agendamento': { en: 'Appointment', es: 'Cita', it: 'Appuntamento' },
  'agendamento': { en: 'appointment', es: 'cita', it: 'appuntamento' },
  'Encaixe': { en: 'Fit-in', es: 'Encaje', it: 'Inserimento' },
  'Bloqueios neste horário': { en: 'Blocks at this time', es: 'Bloqueos en este horario', it: 'Blocchi in questo orario' },
  'Novo bloqueio': { en: 'New block', es: 'Nuevo bloqueo', it: 'Nuovo blocco' },
  'Bloqueio': { en: 'Block', es: 'Bloqueo', it: 'Blocco' },
  'Bloquear': { en: 'Block', es: 'Bloquear', it: 'Blocca' },
  // sidebar / search
  'Buscar paciente, agendamento…': { en: 'Search patient, appointment…', es: 'Buscar paciente, cita…', it: 'Cerca paziente, appuntamento…' },
  'Buscar profissional, especialidade, convênio, unidade, sala…':
    { en: 'Search professional, specialty, insurance, unit, room…', es: 'Buscar profesional, especialidad, seguro, unidad, sala…', it: 'Cerca professionista, specialità, assicurazione, sede, sala…' },
  'Buscar e adicionar procedimento…': { en: 'Search and add procedure…', es: 'Buscar y añadir procedimiento…', it: 'Cerca e aggiungi procedura…' },
  'Digite para buscar o procedimento…': { en: 'Type to search the procedure…', es: 'Escribe para buscar el procedimiento…', it: 'Digita per cercare la procedura…' },
  'Buscar paciente…': { en: 'Search patient…', es: 'Buscar paciente…', it: 'Cerca paziente…' },
  'Buscar': { en: 'Search', es: 'Buscar', it: 'Cerca' },
  'Refine a busca para ver mais resultados': { en: 'Refine the search to see more results', es: 'Refina la búsqueda para ver más resultados', it: 'Affina la ricerca per vedere più risultati' },
  'Fase 2': { en: 'Phase 2', es: 'Fase 2', it: 'Fase 2' },
  // agendas selector
  'Agendas:': { en: 'Schedules:', es: 'Agendas:', it: 'Agende:' },
  'Agendas': { en: 'Schedules', es: 'Agendas', it: 'Agende' },
  'Agenda': { en: 'Schedule', es: 'Agenda', it: 'Agenda' },
  // filter section titles
  'Profissionais': { en: 'Professionals', es: 'Profesionales', it: 'Professionisti' },
  'Profissional': { en: 'Professional', es: 'Profesional', it: 'Professionista' },
  'Especialidade': { en: 'Specialty', es: 'Especialidad', it: 'Specialità' },
  'Convênios': { en: 'Insurances', es: 'Seguros', it: 'Assicurazioni' },
  'Convênio': { en: 'Insurance', es: 'Seguro', it: 'Assicurazione' },
  'Unidades': { en: 'Units', es: 'Unidades', it: 'Sedi' },
  'Unidade': { en: 'Unit', es: 'Unidad', it: 'Sede' },
  'Salas': { en: 'Rooms', es: 'Salas', it: 'Sale' },
  'Selecionar': { en: 'Select', es: 'Seleccionar', it: 'Seleziona' },
  'Limpar': { en: 'Clear', es: 'Borrar', it: 'Cancella' },
  // booking phrases
  'Alterações': { en: 'Changes', es: 'Cambios', it: 'Modifiche' },
  'Histórico de alterações': { en: 'Change history', es: 'Historial de cambios', it: 'Storico delle modifiche' },
  'Agendamento criado': { en: 'Appointment created', es: 'Cita creada', it: 'Appuntamento creato' },
  'Horário remarcado': { en: 'Time rescheduled', es: 'Horario reprogramado', it: 'Orario riprogrammato' },
  'Procedimento alterado': { en: 'Procedure changed', es: 'Procedimiento modificado', it: 'Procedura modificata' },
  'Presença confirmada pelo paciente': { en: 'Attendance confirmed by patient', es: 'Asistencia confirmada por el paciente', it: 'Presenza confermata dal paziente' },
  'Check-in realizado': { en: 'Check-in done', es: 'Check-in realizado', it: 'Check-in effettuato' },
  'Atendimento iniciado': { en: 'Visit started', es: 'Atención iniciada', it: 'Visita iniziata' },
  'Atendimento finalizado': { en: 'Visit completed', es: 'Atención finalizada', it: 'Visita completata' },
  'Marcado como falta': { en: 'Marked as no-show', es: 'Marcado como ausencia', it: 'Segnato come assente' },
  'Agendamento cancelado': { en: 'Appointment cancelled', es: 'Cita cancelada', it: 'Appuntamento annullato' },
  'Cancelar agendamento': { en: 'Cancel appointment', es: 'Cancelar cita', it: 'Annulla appuntamento' },
  'Remarcar agendamento': { en: 'Reschedule appointment', es: 'Reprogramar cita', it: 'Riprogramma appuntamento' },
  'Confirmar cancelamento': { en: 'Confirm cancellation', es: 'Confirmar cancelación', it: 'Conferma annullamento' },
  'Confirmar edição': { en: 'Confirm edit', es: 'Confirmar edición', it: 'Conferma modifica' },
  'Novo horário': { en: 'New time', es: 'Nuevo horario', it: 'Nuovo orario' },
  'Novo paciente': { en: 'New patient', es: 'Nuevo paciente', it: 'Nuovo paziente' },
  'Nenhum paciente encontrado.': { en: 'No patients found.', es: 'No se encontraron pacientes.', it: 'Nessun paziente trovato.' },
  'Nenhum procedimento encontrado.': { en: 'No procedures found.', es: 'No se encontraron procedimientos.', it: 'Nessuna procedura trovata.' },
  // block modal fields
  'Data início': { en: 'Start date', es: 'Fecha de inicio', it: 'Data inizio' },
  'Data fim': { en: 'End date', es: 'Fecha de fin', it: 'Data fine' },
  'Motivo / título': { en: 'Reason / title', es: 'Motivo / título', it: 'Motivo / titolo' },
  'Observação (opcional)': { en: 'Note (optional)', es: 'Observación (opcional)', it: 'Nota (opzionale)' },
  'Dia inteiro': { en: 'All day', es: 'Todo el día', it: 'Tutto il giorno' },
  'Recorrência': { en: 'Recurrence', es: 'Recurrencia', it: 'Ricorrenza' },
  'Aplica-se a': { en: 'Applies to', es: 'Se aplica a', it: 'Si applica a' },
  'Justificativa': { en: 'Reason', es: 'Justificación', it: 'Motivazione' },
  'Por paciente': { en: 'By patient', es: 'Por paciente', it: 'Per paziente' },
  'Pela clínica': { en: 'By clinic', es: 'Por la clínica', it: 'Per clinica' },
  'dias da semana, dentro do período': { en: 'days of the week, within the period', es: 'días de la semana, dentro del período', it: 'giorni della settimana, entro il periodo' },
  // procedures (full — vêm antes de "Consulta")
  'Consulta Dermatologia': { en: 'Dermatology consultation', es: 'Consulta de Dermatología', it: 'Visita di Dermatologia' },
  'Consulta Ortopedia': { en: 'Orthopedics consultation', es: 'Consulta de Ortopedia', it: 'Visita di Ortopedia' },
  'Consulta Cardiologia': { en: 'Cardiology consultation', es: 'Consulta de Cardiología', it: 'Visita di Cardiologia' },
  'Consulta Clínico Geral': { en: 'General practice consultation', es: 'Consulta de Medicina General', it: 'Visita di Medicina Generale' },
  'Consulta Pediatria': { en: 'Pediatrics consultation', es: 'Consulta de Pediatría', it: 'Visita di Pediatria' },
  'Eletrocardiograma': { en: 'Electrocardiogram', es: 'Electrocardiograma', it: 'Elettrocardiogramma' },
  'Eletrocardiógrafo': { en: 'Electrocardiograph', es: 'Electrocardiógrafo', it: 'Elettrocardiografo' },
  'Ultrassonografia': { en: 'Ultrasound', es: 'Ecografía', it: 'Ecografia' },
  'Mapeamento de pele': { en: 'Skin mapping', es: 'Mapeo de piel', it: 'Mappatura della pelle' },
  'Infiltração': { en: 'Injection', es: 'Infiltración', it: 'Infiltrazione' },
  'Vacinação': { en: 'Vaccination', es: 'Vacunación', it: 'Vaccinazione' },
  'Teleconsulta': { en: 'Teleconsultation', es: 'Teleconsulta', it: 'Teleconsulto' },
  // rooms / equipment
  'Sala de Procedimentos': { en: 'Procedure Room', es: 'Sala de Procedimientos', it: 'Sala Procedure' },
  'Sala de Ultrassom': { en: 'Ultrasound Room', es: 'Sala de Ecografía', it: 'Sala Ecografia' },
  'Sala de Exames': { en: 'Exam Room', es: 'Sala de Exámenes', it: 'Sala Esami' },
  'Consultório': { en: 'Office', es: 'Consultorio', it: 'Studio' },
  // specialties
  'Dermatologia': { en: 'Dermatology', es: 'Dermatología', it: 'Dermatologia' },
  'Tricologia': { en: 'Trichology', es: 'Tricología', it: 'Tricologia' },
  'Ortopedia': { en: 'Orthopedics', es: 'Ortopedia', it: 'Ortopedia' },
  'Traumatologia': { en: 'Traumatology', es: 'Traumatología', it: 'Traumatologia' },
  'Medicina Esportiva': { en: 'Sports Medicine', es: 'Medicina Deportiva', it: 'Medicina dello Sport' },
  'Cardiologia': { en: 'Cardiology', es: 'Cardiología', it: 'Cardiologia' },
  'Clínico Geral': { en: 'General Practice', es: 'Medicina General', it: 'Medicina Generale' },
  'Clínica geral': { en: 'General practice', es: 'Medicina general', it: 'Medicina generale' },
  'Pediatria': { en: 'Pediatrics', es: 'Pediatría', it: 'Pediatria' },
  'Procedimentos': { en: 'Procedures', es: 'Procedimientos', it: 'Procedure' },
  'Imagem': { en: 'Imaging', es: 'Imagen', it: 'Imaging' },
  // appointment types / statuses
  'Em atendimento': { en: 'In progress', es: 'En atención', it: 'In corso' },
  'Telemedicina': { en: 'Telemedicine', es: 'Telemedicina', it: 'Telemedicina' },
  'Consulta': { en: 'Consultation', es: 'Consulta', it: 'Visita' },
  'Retorno': { en: 'Follow-up', es: 'Revisión', it: 'Controllo' },
  'Exame': { en: 'Exam', es: 'Examen', it: 'Esame' },
  'Procedimento': { en: 'Procedure', es: 'Procedimiento', it: 'Procedura' },
  'Marcado': { en: 'Scheduled', es: 'Programado', it: 'Programmato' },
  'Confirmado': { en: 'Confirmed', es: 'Confirmado', it: 'Confermato' },
  'Aguardando': { en: 'Waiting', es: 'Esperando', it: 'In attesa' },
  'Finalizado': { en: 'Completed', es: 'Finalizado', it: 'Completato' },
  'Faltou': { en: 'No-show', es: 'Ausente', it: 'Assente' },
  'Cancelado': { en: 'Cancelled', es: 'Cancelado', it: 'Annullato' },
  'Remarcado': { en: 'Rescheduled', es: 'Reprogramado', it: 'Riprogrammato' },
  'Confirm.': { en: 'Confirm.', es: 'Confirm.', it: 'Conf.' },
  'Aguard.': { en: 'Waiting', es: 'Esper.', it: 'Attesa' },
  'Atend.': { en: 'In prog.', es: 'En at.', it: 'In corso' },
  'Final.': { en: 'Done', es: 'Final.', it: 'Fatto' },
  'Cancel.': { en: 'Cancelled', es: 'Cancel.', it: 'Annull.' },
  'Remarc.': { en: 'Resched.', es: 'Reprog.', it: 'Riprog.' },
  // convênios
  'Particular': { en: 'Private', es: 'Particular', it: 'Privato' },
  // doctoralia / availability
  'Disponível em Doctoralia': { en: 'Available on Doctoralia', es: 'Disponible en Doctoralia', it: 'Disponibile su Doctoralia' },
  'Disponível': { en: 'Available', es: 'Disponible', it: 'Disponibile' },
  // card badges
  '1ª vez': { en: '1st visit', es: '1ª vez', it: '1ª volta' },
  'novo': { en: 'new', es: 'nuevo', it: 'nuovo' },
  'procedimentos': { en: 'procedures', es: 'procedimientos', it: 'procedure' },
  'procedimento': { en: 'procedure', es: 'procedimiento', it: 'procedura' },
  // waiting-list bits
  'em atendimento': { en: 'in progress', es: 'en atención', it: 'in corso' },
  'min de espera': { en: 'min waiting', es: 'min de espera', it: 'min di attesa' },
  // context card / actions & notification summary (dynamic strings)
  'Remarcar': { en: 'Reschedule', es: 'Reprogramar', it: 'Riprogramma' },
  'Remarcando': { en: 'Rescheduling', es: 'Reprogramando', it: 'Riprogrammazione di' },
  'Abrir': { en: 'Open', es: 'Abrir', it: 'Apri' },
  'Sem cobrança': { en: 'No charge', es: 'Sin cargo', it: 'Nessun addebito' },
  'notificações recebidas': { en: 'notifications received', es: 'notificaciones recibidas', it: 'notifiche ricevute' },
  'notificação recebida': { en: 'notification received', es: 'notificación recibida', it: 'notifica ricevuta' },
  'presença confirmada': { en: 'attendance confirmed', es: 'asistencia confirmada', it: 'presenza confermata' },
  'agendadas': { en: 'scheduled', es: 'programadas', it: 'programmate' },
  'agendada': { en: 'scheduled', es: 'programada', it: 'programmata' },
  'com falha': { en: 'failed', es: 'con error', it: 'non riuscite' },
  // booking drawer + patient fields + cancel/reschedule
  'Agendamento': { en: 'Appointment', es: 'Cita', it: 'Appuntamento' },
  'Ficha': { en: 'Record', es: 'Ficha', it: 'Scheda' },
  'Histórico': { en: 'History', es: 'Historial', it: 'Cronologia' },
  'Conta': { en: 'Account', es: 'Cuenta', it: 'Account' },
  'Celular': { en: 'Mobile', es: 'Celular', it: 'Cellulare' },
  'Telefone fixo': { en: 'Landline', es: 'Teléfono fijo', it: 'Telefono fisso' },
  'Atendimento': { en: 'Visit', es: 'Atención', it: 'Visita' },
  'Selecione': { en: 'Select', es: 'Seleccione', it: 'Seleziona' },
  'Procedimentos': { en: 'Procedures', es: 'Procedimientos', it: 'Procedure' },
  'Local / unidade': { en: 'Location / unit', es: 'Local / unidad', it: 'Sede / unità' },
  'Local / sala': { en: 'Location / room', es: 'Local / sala', it: 'Sede / stanza' },
  'Pagamento': { en: 'Payment', es: 'Pago', it: 'Pagamento' },
  'Tabela particular': { en: 'Private price list', es: 'Tabla particular', it: 'Listino privato' },
  'Valor': { en: 'Amount', es: 'Importe', it: 'Importo' },
  'Resumo': { en: 'Summary', es: 'Resumen', it: 'Riepilogo' },
  'Nome social': { en: 'Preferred name', es: 'Nombre social', it: 'Nome preferito' },
  'Origem (como chegou)': { en: 'Source (how they arrived)', es: 'Origen (cómo llegó)', it: 'Origine (come è arrivato)' },
  'Pendências': { en: 'Pending items', es: 'Pendientes', it: 'In sospeso' },
  'Indicado por (profissional)': { en: 'Referred by (professional)', es: 'Referido por (profesional)', it: 'Segnalato da (professionista)' },
  'Indicado por': { en: 'Referred by', es: 'Referido por', it: 'Segnalato da' },
  'Matrícula / carteirinha': { en: 'Member ID / card', es: 'Matrícula / credencial', it: 'Tessera / matricola' },
  'Motivo do cancelamento': { en: 'Cancellation reason', es: 'Motivo de la cancelación', it: 'Motivo dell’annullamento' },
  'Por paciente': { en: 'By patient', es: 'Por paciente', it: 'Dal paziente' },
  'Pela clínica': { en: 'By clinic', es: 'Por la clínica', it: 'Dalla clinica' },
  'Canal': { en: 'Channel', es: 'Canal', it: 'Canale' },
  // generic buttons / labels
  'Voltar': { en: 'Back', es: 'Volver', it: 'Indietro' },
  'Fechar': { en: 'Close', es: 'Cerrar', it: 'Chiudi' },
  'Salvar': { en: 'Save', es: 'Guardar', it: 'Salva' },
  'Cancelar': { en: 'Cancel', es: 'Cancelar', it: 'Annulla' },
  'Excluir': { en: 'Delete', es: 'Eliminar', it: 'Elimina' },
  'Confirmar': { en: 'Confirm', es: 'Confirmar', it: 'Conferma' },
  'Chamar': { en: 'Call', es: 'Llamar', it: 'Chiama' },
  'Finalizar': { en: 'Finish', es: 'Finalizar', it: 'Completa' },
  'Paciente': { en: 'Patient', es: 'Paciente', it: 'Paziente' },
  'Horário': { en: 'Time', es: 'Horario', it: 'Orario' },
  'Início': { en: 'Start', es: 'Inicio', it: 'Inizio' },
  'Fim': { en: 'End', es: 'Fin', it: 'Fine' },
  'Data': { en: 'Date', es: 'Fecha', it: 'Data' },
  'Dia': { en: 'Day', es: 'Día', it: 'Giorno' },
  'Sala': { en: 'Room', es: 'Sala', it: 'Sala' },
  'Clínica inteira': { en: 'Entire clinic', es: 'Clínica entera', it: 'Intera clinica' },
  'Livre': { en: 'Free', es: 'Libre', it: 'Libero' },
  // dates — weekdays (lowercase, header usa capitalize via CSS)
  'domingo': { en: 'Sunday', es: 'Domingo', it: 'Domenica' },
  'segunda': { en: 'Monday', es: 'Lunes', it: 'Lunedì' },
  'terça': { en: 'Tuesday', es: 'Martes', it: 'Martedì' },
  'quarta': { en: 'Wednesday', es: 'Miércoles', it: 'Mercoledì' },
  'quinta': { en: 'Thursday', es: 'Jueves', it: 'Giovedì' },
  'sexta': { en: 'Friday', es: 'Viernes', it: 'Venerdì' },
  'sábado': { en: 'Saturday', es: 'Sábado', it: 'Sabato' },
  // weekday abbreviations (week-view column headers, capitalized via CSS)
  'seg': { en: 'Mon', es: 'Lun', it: 'Lun' },
  'ter': { en: 'Tue', es: 'Mar', it: 'Mar' },
  'qua': { en: 'Wed', es: 'Mié', it: 'Mer' },
  'qui': { en: 'Thu', es: 'Jue', it: 'Gio' },
  'sex': { en: 'Fri', es: 'Vie', it: 'Ven' },
  'sáb': { en: 'Sat', es: 'Sáb', it: 'Sab' },
  'dom': { en: 'Sun', es: 'Dom', it: 'Dom' },
  // months (lowercase)
  'janeiro': { en: 'January', es: 'Enero', it: 'Gennaio' },
  'fevereiro': { en: 'February', es: 'Febrero', it: 'Febbraio' },
  'março': { en: 'March', es: 'Marzo', it: 'Marzo' },
  'abril': { en: 'April', es: 'Abril', it: 'Aprile' },
  'maio': { en: 'May', es: 'Mayo', it: 'Maggio' },
  'junho': { en: 'June', es: 'Junio', it: 'Giugno' },
  'julho': { en: 'July', es: 'Julio', it: 'Luglio' },
  'agosto': { en: 'August', es: 'Agosto', it: 'Agosto' },
  'setembro': { en: 'September', es: 'Septiembre', it: 'Settembre' },
  'outubro': { en: 'October', es: 'Octubre', it: 'Ottobre' },
  'novembro': { en: 'November', es: 'Noviembre', it: 'Novembre' },
  'dezembro': { en: 'December', es: 'Diciembre', it: 'Dicembre' },
  // short months that differ from PT
  'fev': { en: 'Feb', es: 'Feb', it: 'Feb' },
  'abr': { en: 'Apr', es: 'Abr', it: 'Apr' },
  'ago': { en: 'Aug', es: 'Ago', it: 'Ago' },
  'set': { en: 'Sep', es: 'Sep', it: 'Set' },
  'out': { en: 'Oct', es: 'Oct', it: 'Ott' },
  'dez': { en: 'Dec', es: 'Dic', it: 'Dic' },
  // "de" no cabeçalho de data ("10 de julho" → EN/IT removem, ES mantém)
  ' de ': { en: ' ', es: ' de ', it: ' ' },
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

function i18nApply(str, lang) {
  if (!str) return str;
  const trimmed = str.trim();
  const ph = I18N_PHRASES[trimmed];
  if (ph) { const t = ph[lang]; if (t != null) return str.replace(trimmed, t); return str; }
  let out = str;
  for (const k of I18N_TERM_KEYS) {
    if (out.indexOf(k) !== -1) {
      const t = I18N_TERMS[k][lang];
      if (t != null) out = out.replace(i18nRegex(k), () => t);
    }
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
  let activeLang = 'pt';   // 'pt' = sem tradução; 'en'|'es'|'it' = veniz ativo
  let busy = false;

  function translateTextNode(node) {
    const cur = node.nodeValue;
    if (!cur || !cur.trim()) return;
    if (!originalsText.has(node)) originalsText.set(node, cur);
    const src = originalsText.get(node);
    const next = i18nApply(src, activeLang);
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
      const next = i18nApply(rec[attr], activeLang);
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

  // Reverte percorrendo TODA a árvore (não só o conjunto "touched"): assim nós
  // que o MutationObserver traduziu de forma assíncrona também voltam ao PT,
  // evitando resíduos ao trocar de idioma.
  function revertAll() {
    busy = true;
    const root = document.getElementById('root');
    if (root) {
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      let n; while ((n = tw.nextNode())) { if (originalsText.has(n)) n.nodeValue = originalsText.get(n); }
      const restoreAttr = el => { const rec = originalsAttr.get(el); if (rec) for (const attr in rec) if (el.hasAttribute && el.hasAttribute(attr)) el.setAttribute(attr, rec[attr]); };
      if (root.nodeType === 1) restoreAttr(root);
      const ew = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
      let e; while ((e = ew.nextNode())) restoreAttr(e);
    }
    // fallback para nós já desconectados que ainda estejam nos conjuntos
    for (const node of touchedText) { if (originalsText.has(node) && node.isConnected) node.nodeValue = originalsText.get(node); }
    for (const el of touchedAttr) { const rec = originalsAttr.get(el); if (rec && el.isConnected) for (const attr in rec) el.setAttribute(attr, rec[attr]); }
    touchedText.clear(); touchedAttr.clear();
    busy = false;
  }

  function onMutations(muts) {
    if (busy || activeLang === 'pt') return;
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
    lang = lang || 'pt';
    if (lang === activeLang) { if (lang !== 'pt') translateAll(); return; }
    // reverte qualquer tradução atual para o PT original antes de trocar
    if (activeLang !== 'pt') revertAll();
    activeLang = lang;
    const root = document.getElementById('root');
    if (lang === 'pt') {
      if (observer) { observer.disconnect(); observer = null; }
      return;
    }
    translateAll();
    if (!observer) {
      observer = new MutationObserver(onMutations);
      if (root) observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }
  }

  return { set };
})();
