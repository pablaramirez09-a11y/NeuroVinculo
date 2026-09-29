/* ==========================================================================
   NEUROVÍNCULO - LÓGICA JAVASCRIPT DINÁMICA
   Psico Orientación Escolar (Filtros, Buscador, Cancelación, Modal y Prioridad)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. SISTEMA DE NOTIFICACIONES TOAST
  // --------------------------------------------------------------------------
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'warning' || type === 'danger') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.35s ease';
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }

  // --------------------------------------------------------------------------
  // 2. FILTRADO DINÁMICO DE CITAS (Todas / Presencial / Virtual)
  // --------------------------------------------------------------------------
  const filterBtns = document.querySelectorAll('.agenda-filters .filter-btn');
  const appointmentCards = document.querySelectorAll('#agendaGrid .appointment-card');

  function updateFilterCounts() {
    const total = document.querySelectorAll('#agendaGrid .appointment-card').length;
    const presenciales = document.querySelectorAll('#agendaGrid .appointment-card[data-modality="presencial"]').length;
    const virtuales = document.querySelectorAll('#agendaGrid .appointment-card[data-modality="virtual"]').length;
    const totalPatients = document.querySelectorAll('#pacientesGrid .patient-card').length;

    const countAll = document.getElementById('countFilterAll');
    const countPres = document.getElementById('countFilterPresencial');
    const countVirt = document.getElementById('countFilterVirtual');
    const statTotal = document.getElementById('statTotalAppointments');
    const statPatients = document.getElementById('statTotalPatients');

    if (countAll) countAll.textContent = total;
    if (countPres) countPres.textContent = presenciales;
    if (countVirt) countVirt.textContent = virtuales;
    if (statTotal) statTotal.textContent = total;
    if (statPatients) statPatients.textContent = totalPatients;
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');
      const allCards = document.querySelectorAll('#agendaGrid .appointment-card');

      allCards.forEach(card => {
        const modality = card.getAttribute('data-modality');
        if (filterValue === 'all' || modality === filterValue) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // 3. BUSCADOR EN TIEMPO REAL (Nombre, Documento, Teléfono, Correo)
  // --------------------------------------------------------------------------
  const patientSearchInput = document.getElementById('patientSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const noResultsMsg = document.getElementById('noResultsMsg');
  const searchResultTag = document.getElementById('searchResultTag');

  function performSearch() {
    if (!patientSearchInput) return;
    const query = patientSearchInput.value.trim().toLowerCase();

    if (btnClearSearch) {
      btnClearSearch.style.display = query.length > 0 ? 'block' : 'none';
    }

    const patientCards = document.querySelectorAll('#pacientesGrid .patient-card');
    const agendaCards = document.querySelectorAll('#agendaGrid .appointment-card');

    let visiblePatientsCount = 0;

    // Filtrar Directorio de Estudiantes
    patientCards.forEach(card => {
      const searchData = (card.getAttribute('data-search') || card.textContent).toLowerCase();
      if (query === '' || searchData.includes(query)) {
        card.style.display = 'flex';
        visiblePatientsCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Filtrar Citas en la Agenda
    agendaCards.forEach(card => {
      const searchData = (card.getAttribute('data-search') || card.textContent).toLowerCase();
      if (query === '' || searchData.includes(query)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    // Actualizar etiqueta de resultados y estado vacío
    if (searchResultTag) {
      searchResultTag.textContent = `${visiblePatientsCount} Estudiantes visibles`;
    }

    if (noResultsMsg) {
      noResultsMsg.style.display = (visiblePatientsCount === 0 && query !== '') ? 'block' : 'none';
    }
  }

  if (patientSearchInput) {
    patientSearchInput.addEventListener('input', performSearch);
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      patientSearchInput.value = '';
      performSearch();
      patientSearchInput.focus();
    });
  }

  // Búsqueda en el Historial General
  const historySearchInput = document.getElementById('historySearchInput');
  if (historySearchInput) {
    historySearchInput.addEventListener('input', () => {
      const query = historySearchInput.value.trim().toLowerCase();
      const historyItems = document.querySelectorAll('#historialGrid .history-item');
      historyItems.forEach(item => {
        const searchData = item.getAttribute('data-search') || '';
        if (query === '' || searchData.includes(query)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 4. CANCELACIÓN Y CONFIRMACIÓN DE CITAS
  // --------------------------------------------------------------------------
  function setupCancelAppointmentButtons() {
    const cancelBtns = document.querySelectorAll('.btn-cancel-appointment');

    cancelBtns.forEach(btn => {
      btn.onclick = async function(e) {
        e.preventDefault();
        const card = btn.closest('.appointment-card');
        if (!card) return;

        const id = btn.getAttribute('data-id');
        if (!id) return; 

        const patientName = card.querySelector('.patient-name') ? card.querySelector('.patient-name').textContent : 'el estudiante';

        try {
          const result = await window.apiFetch(`/api/appointments/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' })
          });
          
          if (result && result.success) {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
              card.remove();
              updateFilterCounts();
              window.fetchAndRenderData(); 
            }, 300);

            showToast(`La cita con ${patientName} ha sido cancelada y enviada al historial.`, 'info');
          } else {
            showToast('Error al cancelar la cita: no encontrada', 'danger');
          }
        } catch (error) {
          console.error(error);
          showToast('Error al cancelar la cita', 'danger');
        }
      };
    });

    const confirmBtns = document.querySelectorAll('.btn-confirm-appointment');
    confirmBtns.forEach(btn => {
      btn.onclick = async function(e) {
        e.preventDefault();
        const card = btn.closest('.appointment-card');
        if (!card) return;

        const id = btn.getAttribute('data-id');
        if (!id) return;

        const patientName = card.querySelector('.patient-name') ? card.querySelector('.patient-name').textContent : 'el estudiante';

        try {
          const result = await window.apiFetch(`/api/appointments/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'confirmed' })
          });
          
          if (result && result.success) {
            showToast(`La cita con ${patientName} ha sido confirmada.`, 'success');
            window.fetchAndRenderData(); 
          } else {
            showToast('Error al confirmar la cita', 'danger');
          }
        } catch (error) {
          console.error(error);
          showToast('Error al confirmar la cita', 'danger');
        }
      };
    });
  }

  setupCancelAppointmentButtons();

  // --------------------------------------------------------------------------
  // 5. ACCIONES EN SECCIÓN "PACIENTES CON MAYOR PRIORIDAD" Y RECORDATORIOS
  // --------------------------------------------------------------------------
  const callBtns = document.querySelectorAll('.btn-call, .btn-quick-call');
  callBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.priority-card, .patient-card, .appointment-card, .reminder-card');
      let name = btn.getAttribute('data-name') || 'el estudiante';
      let phone = btn.getAttribute('data-phone') || '+57 312 456 7890';

      if (card) {
        const nameInput = card.querySelector('.priority-input-name, .patient-card-name-input, .card-patient-name-input');
        if (nameInput && nameInput.value.trim()) {
          name = nameInput.value.trim();
        }
        const phoneInput = card.querySelector('.priority-input-phone, input[type="tel"]');
        if (phoneInput && phoneInput.value.trim()) {
          phone = phoneInput.value.trim();
        }
      }

      showToast(`📞 Contactando a ${name} al número ${phone}...`, 'info');
    });
  });

  const confirmPriorityBtns = document.querySelectorAll('.btn-confirm-priority');
  confirmPriorityBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-priority-target');
      const card = btn.closest('.priority-card');
      let name = btn.getAttribute('data-name') || 'el estudiante';

      if (card) {
        const nameInput = card.querySelector('.priority-input-name');
        if (nameInput && nameInput.value.trim()) {
          name = nameInput.value.trim();
        }
      }

      const statusTag = document.getElementById(`${targetId}-status`);
      if (statusTag) {
        statusTag.className = 'priority-status-tag status-confirmed-tag';
        statusTag.textContent = '✓ Cita Confirmada';
      }

      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg> <span>Confirmada</span>`;
      btn.disabled = true;
      btn.style.backgroundColor = '#047857';
      btn.style.cursor = 'default';

      showToast(`¡Cita de Psico Orientación confirmada para ${name}!`, 'success');
    });
  });

  // Botón de confirmación rápida en recordatorios (Atención Prioritaria)
  const quickConfirmBtns = document.querySelectorAll('.btn-quick-confirm');
  quickConfirmBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.reminder-card');
      let name = 'el estudiante';
      if (card) {
        const nameInput = card.querySelector('.inline-patient-input');
        if (nameInput && nameInput.value.trim()) {
          name = nameInput.value.trim();
        }
      }
      btn.textContent = '✓ Confirmada';
      btn.disabled = true;
      btn.style.backgroundColor = '#047857';
      showToast(`Cita de Atención Prioritaria confirmada para ${name} en el Aula Psico Orientación Escolar.`, 'success');
    });
  });

  const completeTaskBtns = document.querySelectorAll('.btn-complete-task');
  completeTaskBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.reminder-card');
      let name = 'el estudiante';
      if (card) {
        const nameInput = card.querySelector('.inline-patient-input');
        if (nameInput && nameInput.value.trim()) {
          name = nameInput.value.trim();
        }
      }
      btn.textContent = '✓ Tarea Completada';
      btn.disabled = true;
      btn.style.backgroundColor = '#64748b';
      showToast(`Informe de Psico Orientación de ${name} guardado y archivado con éxito.`, 'success');
    });
  });

  // --------------------------------------------------------------------------
  // 6. MODAL Y REGISTRO DE NUEVAS CITAS (+ NUEVA CITA)
  // --------------------------------------------------------------------------
  const newAppointmentModal = document.getElementById('newAppointmentModal');
  const btnOpenNewAppointment = document.getElementById('btnOpenNewAppointment');
  const btnOpenNewAppointment2 = document.getElementById('btnOpenNewAppointment2');
  const btnCloseNewAppointmentModal = document.getElementById('btnCloseNewAppointmentModal');
  const btnCancelModalForm = document.getElementById('btnCancelModalForm');
  const newAppointmentForm = document.getElementById('newAppointmentForm');

  function openNewAppointmentModal() {
    if (newAppointmentModal) {
      newAppointmentModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Asegurar que el campo Lugar tenga el valor por defecto Aula Psico Orientación Escolar
      const locInput = document.getElementById('newAppointmentLocation');
      if (locInput) locInput.value = 'Aula Psico Orientación Escolar';
      
      // Bloquear fechas anteriores al día de hoy
      const dateInput = document.getElementById('newAppointmentDate');
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
      }
      
      const warning = document.getElementById('occupiedTimesWarning');
      if (warning) warning.style.display = 'none';
    }
  }

  function closeNewAppointmentModal() {
    if (newAppointmentModal) {
      newAppointmentModal.classList.remove('active');
      document.body.style.overflow = '';
      if (newAppointmentForm) newAppointmentForm.reset();
      const locInput = document.getElementById('newAppointmentLocation');
      if (locInput) locInput.value = 'Aula Psico Orientación Escolar';
      const extraContainer = document.getElementById('extraSessionContainer');
      if (extraContainer) extraContainer.style.display = 'none';
      
      // Reset extra session fields display
      const singleWeekly = document.getElementById('extraSessionSingleWeekly');
      const customBlock = document.getElementById('extraSessionCustom');
      const weeklyCount = document.getElementById('weeklyCountGroup');
      if (singleWeekly) singleWeekly.style.display = 'block';
      if (customBlock) customBlock.style.display = 'none';
      if (weeklyCount) weeklyCount.style.display = 'none';
    }
  }

  // Helper functions for dynamic extra session scheduling
  window.toggleExtraSessionFields = function() {
    const type = document.getElementById('extraSessionType').value;
    const singleWeekly = document.getElementById('extraSessionSingleWeekly');
    const customBlock = document.getElementById('extraSessionCustom');
    const weeklyCount = document.getElementById('weeklyCountGroup');
    const lblExtraDate = document.getElementById('lblExtraDate');

    if (type === 'single') {
      singleWeekly.style.display = 'block';
      customBlock.style.display = 'none';
      weeklyCount.style.display = 'none';
      if (lblExtraDate) lblExtraDate.textContent = 'Fecha de la siguiente cita';
    } else if (type === 'weekly') {
      singleWeekly.style.display = 'block';
      customBlock.style.display = 'none';
      weeklyCount.style.display = 'block';
      if (lblExtraDate) lblExtraDate.textContent = 'Fecha de la PRIMERA sesión extra';
    } else if (type === 'custom') {
      singleWeekly.style.display = 'none';
      customBlock.style.display = 'block';
    }
  };

  window.addCustomSessionRow = function() {
    const list = document.getElementById('customSessionsList');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'form-row custom-session-row';
    row.style.marginBottom = '0.5rem';
    row.innerHTML = `
      <div class="form-group" style="margin-bottom: 0;"><input type="date" class="form-input custom-date"></div>
      <div class="form-group" style="margin-bottom: 0;"><input type="time" class="form-input custom-time"></div>
      <div class="form-group" style="margin-bottom: 0;">
        <div style="display: flex; gap: 0.5rem;">
          <input type="time" class="form-input custom-time-end" style="flex: 1;">
          <button type="button" class="btn btn-outline" style="padding: 0 0.5rem;" onclick="this.closest('.custom-session-row').remove()" title="Eliminar">&times;</button>
        </div>
      </div>
    `;
    list.appendChild(row);
  };

  if (btnOpenNewAppointment) {
    btnOpenNewAppointment.addEventListener('click', openNewAppointmentModal);
  }
  
  if (btnOpenNewAppointment2) {
    btnOpenNewAppointment2.addEventListener('click', openNewAppointmentModal);
  }

  if (btnCloseNewAppointmentModal) {
    btnCloseNewAppointmentModal.addEventListener('click', closeNewAppointmentModal);
  }

  if (btnCancelModalForm) {
    btnCancelModalForm.addEventListener('click', closeNewAppointmentModal);
  }

  if (newAppointmentModal) {
    newAppointmentModal.addEventListener('click', (e) => {
      if (e.target === newAppointmentModal) closeNewAppointmentModal();
    });
  }

  const dateInput = document.getElementById('newAppointmentDate');
  const occupiedWarning = document.getElementById('occupiedTimesWarning');
  if (dateInput && occupiedWarning) {
    dateInput.addEventListener('change', () => {
      const selectedDate = dateInput.value;
      if (!selectedDate || !window.currentAppointments) {
        occupiedWarning.style.display = 'none';
        return;
      }
      
      const occupied = window.currentAppointments.filter(a => a.date === selectedDate && a.status !== 'cancelled');
      if (occupied.length > 0) {
        const times = occupied.map(a => `${a.time_start.substring(0,5)} - ${a.time_end.substring(0,5)}`).join(', ');
        occupiedWarning.innerHTML = `<strong>⚠️ Horarios ya ocupados para el <span style="text-decoration: underline; color: var(--accent-blue); font-size: 1rem;">${selectedDate}</span>:</strong><br>${times}`;
        occupiedWarning.style.display = 'block';
      } else {
        occupiedWarning.style.display = 'none';
      }
    });
  }

  // Envío del Formulario de Nueva Cita
  if (newAppointmentForm) {
    newAppointmentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstName = document.getElementById('newPatientName').value.trim();
      const lastName = document.getElementById('newPatientLastName') ? document.getElementById('newPatientLastName').value.trim() : '';
      const name = `${firstName} ${lastName}`.trim();
      const doc = document.getElementById('newPatientDoc').value.trim();
      const grade = document.getElementById('newPatientGrade') ? document.getElementById('newPatientGrade').value : '';
      const guardian = document.getElementById('newPatientGuardian') ? document.getElementById('newPatientGuardian').value.trim() : '';
      const phone = document.getElementById('newPatientPhone').value.trim();
      const email = document.getElementById('newPatientEmail').value.trim();
      const allergies = document.getElementById('newPatientAllergies') ? document.getElementById('newPatientAllergies').value.trim() : '';
      
      const is_necessary = document.getElementById('newAppointmentForce') ? document.getElementById('newAppointmentForce').checked : false;

      const dateInputVal = document.getElementById('newAppointmentDate');
      let date = dateInputVal && dateInputVal.value ? dateInputVal.value : new Date().toISOString().split('T')[0];
      
      const timeStartInput = document.getElementById('newAppointmentTimeStart');
      const timeEndInput = document.getElementById('newAppointmentTimeEnd');
      
      let time_start = timeStartInput && timeStartInput.value ? timeStartInput.value + ':00' : '08:00:00';
      let time_end = timeEndInput && timeEndInput.value ? timeEndInput.value + ':00' : '09:00:00';
      
      const modality = document.getElementById('newAppointmentModality').value;
      const consultationType = document.getElementById('newAppointmentType') ? document.getElementById('newAppointmentType').value : '1';
      const location = document.getElementById('newAppointmentLocation').value || 'Aula Psico Orientación Escolar';
      const reason = document.getElementById('newAppointmentReason').value.trim();
      
      const payload = {
        name,
        allergies,
        document: doc,
        grade,
        guardian,
        phone,
        email,
        date,
        time_start,
        time_end,
        modality: modality.toLowerCase(),
        consultationType,
        reason,
        is_necessary
      };

      // Validar en el frontend antes de enviar
      if (window.currentAppointments) {
        const conflict = window.currentAppointments.some(a => {
          if (a.date !== date || a.status === 'cancelled') return false;
          const existingStart = a.time_start.substring(0, 5);
          const existingEnd = a.time_end ? a.time_end.substring(0, 5) : existingStart;
          const newStart = time_start.substring(0, 5);
          const newEnd = time_end ? time_end.substring(0, 5) : newStart;
          return newStart < existingEnd && newEnd > existingStart;
        });
        if (conflict) {
          showToast('Error: El horario seleccionado interfiere con una cita ya agendada.', 'danger');
          return;
        }
      }

      try {
        const result = await window.apiFetch('/api/appointments', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        if (result && result.success) {
          showToast(`¡Cita con ${name} registrada en el ${location}!`, 'success');
          
          if (is_necessary) {
            const extraType = document.getElementById('extraSessionType').value;
            
            const sendExtra = async (dateVal, timeVal, timeEndVal) => {
              let extraTimeEnd = timeEndVal;
              if (!extraTimeEnd) {
                const [h, m] = timeVal.split(':');
                const endH = String((parseInt(h, 10) + 1) % 24).padStart(2, '0');
                extraTimeEnd = `${endH}:${m}`;
              }
              
              if (window.currentAppointments) {
                const conflict = window.currentAppointments.some(a => {
                  if (a.date !== dateVal || a.status === 'cancelled') return false;
                  const existingStart = a.time_start.substring(0, 5);
                  const existingEnd = a.time_end ? a.time_end.substring(0, 5) : existingStart;
                  const newStart = timeVal.substring(0, 5);
                  const newEnd = extraTimeEnd;
                  return newStart < existingEnd && newEnd > existingStart;
                });
                if (conflict) {
                  showToast(`Cita extra omitida: El horario interfiere con una cita ya agendada el ${dateVal}.`, 'warning');
                  return;
                }
              }

              const extraPayload = { ...payload, date: dateVal, time_start: timeVal + ':00', time_end: extraTimeEnd + ':00' };
              try {
                const r = await window.apiFetch('/api/appointments', { method: 'POST', body: JSON.stringify(extraPayload) });
                if (r && r.success) showToast(`¡Sesión para ${name} el ${dateVal} registrada!`, 'success');
              } catch(e) { console.error('Error al agendar sesión adicional', e); }
            };

            if (extraType === 'single' || extraType === 'weekly') {
              const eDate = document.getElementById('extraAppointmentDate').value;
              const eTime = document.getElementById('extraAppointmentTimeStart').value;
              const eTimeEnd = document.getElementById('extraAppointmentTimeEnd').value;
              if (eDate && eTime) {
                 if (extraType === 'single') {
                   await sendExtra(eDate, eTime, eTimeEnd);
                 } else {
                   const count = parseInt(document.getElementById('extraWeeklyCount').value, 10) || 2;
                   // Use local timezone correctly
                   const [year, month, day] = eDate.split('-');
                   let currDate = new Date(year, month - 1, day);
                   
                   for (let i = 0; i < count; i++) {
                     const iterDateStr = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}-${String(currDate.getDate()).padStart(2, '0')}`;
                     await sendExtra(iterDateStr, eTime, eTimeEnd);
                     currDate.setDate(currDate.getDate() + 7);
                   }
                 }
              }
            } else if (extraType === 'custom') {
              const rows = document.querySelectorAll('.custom-session-row');
              for (const row of rows) {
                const d = row.querySelector('.custom-date').value;
                const t = row.querySelector('.custom-time').value;
                const te = row.querySelector('.custom-time-end') ? row.querySelector('.custom-time-end').value : '';
                if (d && t) {
                  await sendExtra(d, t, te);
                }
              }
            }
          }
          
          // Generar y descargar archivo .ics con formato estricto (\r\n) para el calendario del dispositivo
          const dateIcs = date.replace(/-/g, '');
          const timeStartIcs = time_start.replace(/:/g, '');
          const timeEndIcs = time_end.replace(/:/g, '');
          
          const icsLines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//NeuroVinculo//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `SUMMARY:Cita Psico Orientación: ${name}`,
            `DESCRIPTION:${reason.replace(/\n/g, '\\n')} - Teléfono: ${phone} - Email: ${email}`,
            `LOCATION:${location}`,
            `DTSTART;TZID=America/Bogota:${dateIcs}T${timeStartIcs}`,
            `DTEND;TZID=America/Bogota:${dateIcs}T${timeEndIcs}`,
            'END:VEVENT',
            'END:VCALENDAR'
          ];
          const icsMSG = icsLines.join('\r\n');
          
          const blob = new Blob([icsMSG], { type: 'text/calendar;charset=utf-8' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cita_${name.replace(/\s+/g, '_')}.ics`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => window.URL.revokeObjectURL(url), 100);

          closeNewAppointmentModal();
          // Recargar datos
          window.fetchAndRenderData();
        } else {
          showToast(result && result.error ? result.error : 'Error al registrar la cita', 'danger');
        }
      } catch (error) {
        console.error(error);
        showToast('Error al registrar la cita', 'danger');
      }
    });
  }

  // ==========================================
  // LÓGICA DE API Y AUTENTICACIÓN
  // ==========================================
  
  const tokenKey = 'neurovinculo_token';
  
  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');
  
  // Removed persistent login on load so the user must log in every time the page is refreshed.
  // The login overlay will remain active until credentials are submitted.

  // Manejar Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('loginUsername').value;
      const passwordInput = document.getElementById('loginPassword').value;
      
      const username = usernameInput.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const password = passwordInput.trim().toUpperCase();
      
      // Client-side validation to allow direct file:// access without backend
      // Very permissive: ignores case, accents, and extra spaces
      if ((username === 'agenda orientacion' || username.includes('agenda')) && password === 'IEFA2026') {
        localStorage.setItem(tokenKey, 'dummy-token-local');
        loginOverlay.classList.remove('active');
        document.getElementById('appMainContent').style.display = 'block';
        showToast('Inicio de sesión exitoso', 'success');
        fetchAndRenderData();
        return;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
          localStorage.setItem(tokenKey, data.token);
          loginOverlay.classList.remove('active');
          document.getElementById('appMainContent').style.display = 'block';
          showToast('Inicio de sesión exitoso', 'success');
          fetchAndRenderData();
        } else {
          showToast(data.error || 'Credenciales inválidas', 'danger');
        }
      } catch (err) {
        showToast('Credenciales inválidas. Comprueba que el usuario sea "Agenda Orientación" y la contraseña "IEFA2026"', 'danger');
      }
    });
  }

  // Fallback DB for local mode
  function getLocalDB() {
    return JSON.parse(localStorage.getItem('neuro_db') || '{"appointments":[],"patients":[]}');
  }
  function saveLocalDB(db) {
    localStorage.setItem('neuro_db', JSON.stringify(db));
  }

  // API Call Helpers
  async function apiFetch(url, options = {}) {
    const t = localStorage.getItem(tokenKey);
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (t) headers['Authorization'] = `Bearer ${t}`;
    
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(tokenKey);
        if (loginOverlay) loginOverlay.classList.add('active');
        throw new Error('No autorizado');
      }
      return await res.json();
    } catch (err) {
      // If the backend is not running or we are on file://, simulate the backend with LocalStorage!
      if (err.message === 'No autorizado') throw err;
      
      let db = getLocalDB();
      
      // MOCK: GET /api/appointments
      if (url === '/api/appointments' && (!options.method || options.method === 'GET')) {
        const today = new Date().toISOString().split('T')[0];
        const validApps = db.appointments.filter(a => a.date >= today);
        if (validApps.length !== db.appointments.length) {
          db.appointments = validApps;
          saveLocalDB(db);
        }
        return db.appointments;
      }
      
      // MOCK: POST /api/appointments
      if (url === '/api/appointments' && options.method === 'POST') {
        const body = JSON.parse(options.body);
        // Verificar que no haya solapamiento en el rango de horas
        const timeConflict = db.appointments.some(a => {
          if (a.date !== body.date || a.status === 'cancelled') return false;
          const existingStart = a.time_start.substring(0, 5);
          const existingEnd = a.time_end ? a.time_end.substring(0, 5) : existingStart;
          const newStart = body.time_start.substring(0, 5);
          const newEnd = body.time_end ? body.time_end.substring(0, 5) : newStart;
          return newStart < existingEnd && newEnd > existingStart;
        });
        if (timeConflict) {
          return { success: false, error: 'Ya existe una cita agendada para esa misma fecha y hora.' };
        }

        let patient = db.patients.find(p => p.document === body.document);
        if (patient) {
          const count = db.appointments.filter(a => a.document === body.document && a.status !== 'cancelled').length;
          if (count >= 2 && !body.is_necessary) {
            return { success: false, error: 'El paciente ya tiene 2 citas activas. Solo se puede agendar más si es necesario.' };
          }
          // Actualizar datos si es necesario
          patient.grade = body.grade || patient.grade;
          patient.guardian = body.guardian || patient.guardian;
        } else {
          patient = { id: Date.now(), name: body.name, document: body.document, grade: body.grade, guardian: body.guardian, phone: body.phone, email: body.email };
          db.patients.push(patient);
        }
        
        body.id = Date.now();
        body.status = 'pending';
        body.patient_id = patient.id;
        db.appointments.push(body);
        saveLocalDB(db);
        return { success: true, appointmentId: body.id };
      }
      
      // MOCK: PATCH /api/appointments/:id/status
      if (url.match(/\/api\/appointments\/(\d+)\/status/) && options.method === 'PATCH') {
        const id = url.split('/')[3];
        const body = JSON.parse(options.body);
        
        // Find the appointment to get its patient_id/document
        const appIdx = db.appointments.findIndex(a => String(a.id) === String(id));
        if (appIdx !== -1) {
          db.appointments[appIdx].status = body.status || 'cancelled';
          saveLocalDB(db);
        }
        return { success: true };
      }

      // MOCK: DELETE /api/appointments/:id
      if (url.match(/\/api\/appointments\/(\d+)/) && options.method === 'DELETE') {
        const id = url.split('/')[3];
        const appIdx = db.appointments.findIndex(a => String(a.id) === String(id));
        if (appIdx !== -1) {
          const patientId = db.appointments[appIdx].patient_id;
          db.appointments.splice(appIdx, 1);
          
          const hasOtherAppointments = db.appointments.some(a => String(a.patient_id) === String(patientId));
          if (!hasOtherAppointments && patientId) {
            db.patients = db.patients.filter(p => String(p.id) !== String(patientId));
          }
          
          saveLocalDB(db);
        }
        return { success: true };
      }
      
      // MOCK: GET /api/patients
      if (url === '/api/patients' && (!options.method || options.method === 'GET')) {
        // Clean up orphan patients dynamically
        const validPatients = db.patients.filter(p => {
          return db.appointments.some(a => String(a.patient_id) === String(p.id));
        });
        
        if (validPatients.length !== db.patients.length) {
          db.patients = validPatients;
          saveLocalDB(db);
        }
        
        return db.patients;
      }
      
      // MOCK: PUT /api/patients/:id/notes
      if (url.match(/\/api\/patients\/(\d+)\/notes/) && options.method === 'PUT') {
        const id = url.split('/')[3];
        const body = JSON.parse(options.body);
        const p = db.patients.find(p => String(p.id) === String(id));
        if (p) {
          p.notes = body.notes;
          p.referral = body.referral;
        }
        saveLocalDB(db);
        return { success: true };
      }
      
      // MOCK: PUT /api/patients/:id/info
      if (url.match(/\/api\/patients\/(\d+)\/info/) && options.method === 'PUT') {
        const id = url.split('/')[3];
        const body = JSON.parse(options.body);
        const p = db.patients.find(p => String(p.id) === String(id));
        if (p) {
          if (body.document !== undefined) p.document = body.document;
          if (body.phone !== undefined) p.phone = body.phone;
          if (body.email !== undefined) p.email = body.email;
          if (body.grade !== undefined) p.grade = body.grade;
          if (body.guardian !== undefined) p.guardian = body.guardian;
          if (body.allergies !== undefined) p.allergies = body.allergies;
        }
        saveLocalDB(db);
        return { success: true };
      }
      
      throw new Error('Simulated backend error');
    }
  }

  function setupHistoryButtons() {
    const rebookBtns = document.querySelectorAll('.btn-rebook-appointment');
    rebookBtns.forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        const name = btn.getAttribute('data-name') || '';
        const doc = btn.getAttribute('data-doc');
        const phone = btn.getAttribute('data-phone');
        const email = btn.getAttribute('data-email');
        const reason = btn.getAttribute('data-reason');
        const modality = btn.getAttribute('data-modality');
        const grade = btn.getAttribute('data-grade');
        const guardian = btn.getAttribute('data-guardian');
        
        const newAppointmentModal = document.getElementById('newAppointmentModal');
        if (newAppointmentModal) {
          newAppointmentModal.classList.add('active');
          document.body.style.overflow = 'hidden';
          
          const nameParts = name.trim().split(' ').filter(Boolean);
          let firstName = name;
          let lastName = '';
          if (nameParts.length === 2) {
            firstName = nameParts[0];
            lastName = nameParts[1];
          } else if (nameParts.length === 3) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else if (nameParts.length >= 4) {
            firstName = nameParts.slice(0, 2).join(' ');
            lastName = nameParts.slice(2).join(' ');
          }

          if(document.getElementById('newPatientName')) document.getElementById('newPatientName').value = firstName;
          if(document.getElementById('newPatientLastName')) document.getElementById('newPatientLastName').value = lastName;
          if(document.getElementById('newPatientDoc')) document.getElementById('newPatientDoc').value = doc || '';
          if(document.getElementById('newPatientPhone')) document.getElementById('newPatientPhone').value = phone || '';
          if(document.getElementById('newPatientEmail')) document.getElementById('newPatientEmail').value = email || '';
          if(document.getElementById('newPatientGrade')) document.getElementById('newPatientGrade').value = grade || '';
          if(document.getElementById('newPatientGuardian')) document.getElementById('newPatientGuardian').value = guardian || '';
          if(document.getElementById('newAppointmentReason')) document.getElementById('newAppointmentReason').value = reason || '';
          
          const modInput = document.getElementById('newAppointmentModality');
          if (modInput && modality) {
             Array.from(modInput.options).forEach(opt => {
                if (opt.value.toLowerCase() === modality.toLowerCase()) opt.selected = true;
             });
          }
          
          const locInput = document.getElementById('newAppointmentLocation');
          if (locInput) locInput.value = 'Aula Psico Orientación Escolar';
        }
      };
    });

    const deleteBtns = document.querySelectorAll('.btn-delete-permanent');
    deleteBtns.forEach(btn => {
      btn.onclick = async function(e) {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        if (!confirm('¿Estás seguro de que deseas borrar esta cita de forma permanente? Esta acción no se puede deshacer.')) return;
        
        try {
          const result = await window.apiFetch(`/api/appointments/${id}`, {
            method: 'DELETE'
          });
          
          if (result && result.success) {
            showToast('Cita borrada permanentemente.', 'info');
            window.fetchAndRenderData();
          } else {
            showToast(result && result.error ? result.error : 'Error al borrar la cita', 'danger');
          }
        } catch (error) {
          console.error(error);
          showToast('Error al borrar la cita', 'danger');
        }
      };
    });
  }

  async function fetchAndRenderData() {
    try {
      const appointments = await apiFetch('/api/appointments');
      const patients = await apiFetch('/api/patients');
      
      window.currentAppointments = appointments || [];
      window.currentPatients = patients || [];
      
      renderAppointments(appointments || []);
      renderPatients(patients || []);
      renderCalendar(appointments || []);
      renderNextAppointment(appointments || []);
      renderReports(appointments || []);
      
      setupCancelAppointmentButtons();
      setupHistoryButtons();
      updateFilterCounts();
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.message !== 'No autorizado') {
        showToast('Error al cargar datos del servidor (modo local)', 'warning');
      }
    }
  }

  function renderNextAppointment(appointments) {
    const card = document.getElementById('nextAppointmentCard');
    const info = document.getElementById('nextAppointmentInfo');
    if (!card || !info) return;

    const now = new Date();
    const upcoming = appointments.filter(a => {
      if (a.status !== 'pending') return false;
      const appDate = new Date(`${a.date}T${a.time_start}`);
      return appDate > now;
    }).sort((a, b) => new Date(`${a.date}T${a.time_start}`) - new Date(`${b.date}T${b.time_start}`));

    if (upcoming.length > 0) {
      const next = upcoming[0];
      const nextTime = new Date(`${next.date}T${next.time_start}`);
      const diffMs = nextTime - now;
      const diffMins = Math.floor(diffMs / 60000);
      
      let timeText = '';
      if (diffMins < 60) {
        timeText = `en ${diffMins} min`;
      } else if (diffMins < 1440 && now.getDate() === nextTime.getDate()) {
        timeText = `en ${Math.floor(diffMins/60)} h`;
      } else {
        timeText = `el ${next.date}`;
      }

      info.innerHTML = `
        <strong>Próxima Cita ${timeText}</strong>
        <span>${next.modality === 'presencial' ? 'Aula Psico Orientación' : 'Sesión Virtual'}</span>
      `;
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  }

  function renderReports(appointments) {
    const elLastMonth = document.getElementById('reportLastMonth');
    const elLastSixMonths = document.getElementById('reportLastSixMonths');
    const elLastYear = document.getElementById('reportLastYear');
    if (!elLastMonth || !elLastSixMonths || !elLastYear) return;

    const now = new Date();
    let countMonth = 0;
    let countSixMonths = 0;
    let countYear = 0;
    
    const reasonsMonth = {};
    const reasonsSixMonths = {};
    const reasonsYear = {};

    appointments.forEach(a => {
      if (a.status === 'cancelled') return;
      
      const appDate = new Date(`${a.date}T${a.time_start || '00:00:00'}`);

      const diffTime = Math.abs(now - appDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const reason = a.reason ? a.reason.trim() : 'No especificado';

      if (diffDays <= 30) {
        countMonth++;
        reasonsMonth[reason] = (reasonsMonth[reason] || 0) + 1;
      }
      if (diffDays <= 180) {
        countSixMonths++;
        reasonsSixMonths[reason] = (reasonsSixMonths[reason] || 0) + 1;
      }
      if (diffDays <= 365) {
        countYear++;
        reasonsYear[reason] = (reasonsYear[reason] || 0) + 1;
      }
    });

    elLastMonth.textContent = countMonth;
    elLastSixMonths.textContent = countSixMonths;
    elLastYear.textContent = countYear;
    
    // Configurar y renderizar la gráfica de Chart.js
    const ctx = document.getElementById('motivosChart');
    if (ctx) {
      if (window.motivosChartInstance) {
        window.motivosChartInstance.destroy();
      }
      
      // Obtener lista de motivos únicos
      const allReasons = new Set([...Object.keys(reasonsYear), ...Object.keys(reasonsSixMonths), ...Object.keys(reasonsMonth)]);
      const labels = Array.from(allReasons);
      
      const dataMonth = labels.map(label => reasonsMonth[label] || 0);
      const dataSixMonths = labels.map(label => reasonsSixMonths[label] || 0);
      const dataYear = labels.map(label => reasonsYear[label] || 0);

      window.motivosChartInstance = new Chart(ctx, {
        type: 'bar', // barra horizontal
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Último Mes',
              data: dataMonth,
              backgroundColor: '#8F9E73', // var(--primary-color)
              borderRadius: 4
            },
            {
              label: 'Últimos 6 Meses',
              data: dataSixMonths,
              backgroundColor: '#607248', // darker green
              borderRadius: 4
            },
            {
              label: 'Último Año',
              data: dataYear,
              backgroundColor: '#c4c4c4', // gray
              borderRadius: 4
            }
          ]
        },
        options: {
          indexAxis: 'y', // Convertir a barras horizontales
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true, // Mostrar leyenda
              position: 'top'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
  }

  let currentCalendarDate = new Date();
  window.currentAppointments = [];

  function renderCalendar(appointments) {
    window.currentAppointments = appointments;
    const calContainer = document.getElementById('calendarContainer');
    if (!calContainer) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    let html = `
      <div style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; color: #0f172a;">
        <button class="btn btn-sm btn-outline" id="btnPrevMonth" style="padding: 0.25rem 0.75rem;">&lt; Mes Anterior</button>
        <div style="font-size: 1.25rem; font-weight: bold;">${monthNames[month]} ${year}</div>
        <button class="btn btn-sm btn-outline" id="btnNextMonth" style="padding: 0.25rem 0.75rem;">Mes Siguiente &gt;</button>
      </div>
    `;
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayNames.forEach(d => {
      html += `<div style="text-align: center; font-weight: bold; color: #64748b; margin-bottom: 0.5rem; font-size: 0.85rem;">${d}</div>`;
    });
    
    for (let i = 0; i < firstDay; i++) {
      html += `<div style="border: 1px solid transparent; border-radius: 8px; min-height: 80px; padding: 0.5rem; background: #f8fafc;"></div>`;
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayApps = appointments.filter(a => a.date === dateStr && a.status === 'pending');
      
      let eventsHtml = dayApps.map(a => {
        const start = a.time_start.substring(0, 5);
        const name = a.patient_name || a.name || 'Paciente';
        return `<div style="background: #e0f2fe; color: #0284c7; padding: 4px; border-radius: 4px; font-size: 0.7rem; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${name}">${start} - ${name}</div>`;
      }).join('');
      
      html += `<div style="border: 1px solid #e2e8f0; border-radius: 8px; min-height: 80px; padding: 0.5rem;"><strong style="font-size: 0.85rem; color: #334155;">${d}</strong><div style="margin-top: 4px;">${eventsHtml}</div></div>`;
    }
    
    calContainer.innerHTML = html;

    // Attach event listeners for calendar navigation
    const prevBtn = document.getElementById('btnPrevMonth');
    const nextBtn = document.getElementById('btnNextMonth');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar(window.currentAppointments);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar(window.currentAppointments);
      });
    }
  }

  function renderAppointments(appointments) {
    const grid = document.getElementById('agendaGrid');
    const historyGrid = document.getElementById('historialGrid');
    
    if (grid) {
      grid.innerHTML = '';
      const activeApps = appointments.filter(a => a.status === 'pending');
      
      if (activeApps.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 2rem;">No hay citas agendadas activas</div>';
      } else {
        activeApps.forEach(app => {
          const modalityClass = app.modality === 'presencial' ? 'badge-presencial' : 'badge-virtual';
          const modalityIcon = app.modality === 'presencial' 
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` 
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;

          const card = document.createElement('article');
          card.className = 'appointment-card';
          card.setAttribute('data-modality', app.modality);
          
          const pName = app.patient_name || app.name || 'Paciente';
          card.setAttribute('data-search', `${pName} ${app.reason}`.toLowerCase());

          const start = app.time_start.substring(0, 5);
          const end = app.time_end.substring(0, 5);

          card.innerHTML = `
            <div class="card-top">
              <div class="appointment-time">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>${start} - ${end}</span>
              </div>
              <span class="session-badge ${modalityClass}">
                ${modalityIcon}
                ${app.modality}
              </span>
            </div>
            <div class="card-body">
              <h3 class="patient-name patient-name-link" data-id="${app.patient_id}" data-name="${pName}" data-date="${app.date}" data-time="${app.time_start}" style="cursor: pointer; text-decoration: underline; text-decoration-color: transparent; transition: text-decoration-color 0.2s;" onmouseover="this.style.textDecorationColor='inherit'" onmouseout="this.style.textDecorationColor='transparent'" title="Ver Ficha de ${pName}">${pName}</h3>
              <p class="appointment-reason"><strong>Motivo:</strong> ${app.reason}</p>
              ${app.allergies ? `<p class="appointment-allergies" style="color:#ef4444; font-size:0.85rem; margin-top:0.25rem;"><strong>Alergias:</strong> ${app.allergies}</p>` : ''}
              <div class="appointment-meta">
                <span class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Lugar: ${app.modality === 'presencial' ? 'Aula Psico Orientación' : 'Meet Institucional'}
                </span>
                <span class="status-pill status-${app.status}">${app.status === 'pending' ? 'Por Confirmar' : app.status === 'confirmed' ? 'Confirmada' : app.status}</span>
              </div>
            </div>
            <div class="card-footer" style="justify-content: flex-end;">
              ${app.status === 'pending' ? `<button class="btn btn-xs btn-success btn-confirm-appointment" style="background-color: #10b981; color: white; border: none;" data-id="${app.id}">Confirmar Cita</button>` : ''}
              <button class="btn btn-xs btn-danger btn-cancel-appointment" data-id="${app.id}">Cancelar Cita</button>
            </div>
          `;
          grid.appendChild(card);
        });

        // Vincular botones de Ver Ficha en Agenda y Nombres
        const agendaNoteBtns = grid.querySelectorAll('.btn-view-detail-agenda, .patient-name-link');
        agendaNoteBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const modal = document.getElementById('patientNoteModal');
            const idInput = document.getElementById('patientNoteId');
            const nameTitle = document.getElementById('patientNoteName');
            const contentArea = document.getElementById('patientNoteContent');
            const historyList = document.getElementById('patientHistoryList');
            const infoDiv = document.getElementById('patientNoteInfo');
            const referralSelect = document.getElementById('patientNoteReferral');

            if (modal && idInput && nameTitle && contentArea) {
              const patientId = btn.getAttribute('data-id');
              const patient = (window.currentPatients || []).find(p => String(p.id) === String(patientId));
              idInput.value = patientId;
              nameTitle.textContent = `Ficha de: ${btn.getAttribute('data-name')}`;
              contentArea.value = patient && patient.notes ? patient.notes : '';
              if (referralSelect) referralSelect.value = patient && patient.referral ? patient.referral : '';
              
              if (infoDiv && patient) {
                infoDiv.innerHTML = `
                  <strong>Documento:</strong> ${patient.document || 'N/A'}<br>
                  <strong>Teléfono:</strong> ${patient.phone || 'N/A'}<br>
                  <strong>Correo:</strong> ${patient.email || 'N/A'}<br>
                  <strong>Grado:</strong> ${patient.grade || 'N/A'}<br>
                  <strong>Acudiente:</strong> ${patient.guardian || 'N/A'}<br>
                  <strong style="color: #ef4444;">Alergias:</strong> <span style="color: #ef4444;">${patient.allergies || 'Ninguna / No reportada'}</span>
                `;
                infoDiv.style.display = 'block';
                const btnToggleEditInfo = document.getElementById('btnToggleEditInfo');
                const patientEditInfoForm = document.getElementById('patientEditInfoForm');
                if (btnToggleEditInfo) btnToggleEditInfo.style.display = 'inline-block';
                if (patientEditInfoForm) patientEditInfoForm.style.display = 'none';
              } else if (infoDiv) {
                infoDiv.style.display = 'none';
              }
              
              const btnEdit = document.getElementById('btnEditPatientNotes');
              
              if (patient && patient.notes && patient.notes.trim() !== '') {
                contentArea.readOnly = true;
                contentArea.style.backgroundColor = '#f1f5f9';
                if (btnEdit) btnEdit.style.display = 'inline-block';
              } else {
                contentArea.readOnly = false;
                contentArea.style.backgroundColor = '';
                if (btnEdit) btnEdit.style.display = 'none';
              }
              
              if (historyList) {
                const historyHtml = (window.currentAppointments || [])
                  .filter(a => String(a.patient_id) === String(patientId) && (a.status === 'cancelled' || a.status === 'confirmed'))
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((a, index, array) => `<div style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>Cita ${array.length - index} | ${a.date} ${a.time_start.substring(0,5)}</strong> - <span style="text-transform: capitalize;">${a.modality}</span>
                      <br><span style="color: #64748b;">Motivo: ${a.reason}</span>
                      <br><span style="color: #64748b; font-style: italic;">Estado: ${a.status === 'pending' ? 'Por Confirmar' : a.status === 'confirmed' ? 'Confirmada' : a.status}</span>
                    </div>
                  </div>`)
                  .join('');
                historyList.innerHTML = historyHtml || '<div style="text-align: center; color: #64748b; font-size: 0.85rem; padding: 0.5rem;">No hay citas previas.</div>';
              }
              modal.classList.add('active');
            }
          });
        });
      }
    }

    if (historyGrid) {
      historyGrid.innerHTML = '';
      const historyApps = appointments.filter(a => a.status === 'cancelled' || a.status === 'confirmed');
      if (historyApps.length === 0) {
        historyGrid.innerHTML = '<div style="text-align: center; padding: 2rem;">El historial está vacío (No hay citas canceladas ni confirmadas)</div>';
      } else {
        const sortedApps = [...historyApps].sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedApps.forEach(app => {
          const item = document.createElement('div');
          item.className = 'history-item';
          item.style.cssText = 'background: white; padding: 1rem; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;';
          
          const pName = app.patient_name || app.name || 'Paciente';
          const patient = (window.currentPatients || []).find(p => String(p.id) === String(app.patient_id));
          item.setAttribute('data-search', `${pName} ${app.document || ''} ${app.reason}`.toLowerCase());
          
          let statusColor = app.status === 'cancelled' ? '#ef4444' : (app.status === 'confirmed' ? '#10b981' : '#f59e0b');
          let statusText = app.status === 'cancelled' ? 'Cancelada' : (app.status === 'confirmed' ? 'Confirmada' : 'Pendiente');

          item.innerHTML = `
            <div style="flex: 1;">
              <strong style="font-size: 1.1rem; color: #0f172a;">${pName}</strong>
              <div style="font-size: 0.9rem; color: #64748b; margin-top: 0.25rem;">
                <span>📅 ${app.date} | ⏰ ${app.time_start.substring(0,5)}</span> | 
                <span style="text-transform: capitalize;">${app.modality}</span>
              </div>
              <div style="font-size: 0.9rem; color: #334155; margin-top: 0.25rem;">Motivo: ${app.reason}</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
              <div style="font-weight: bold; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; background-color: ${statusColor}20; color: ${statusColor};">
                ${statusText}
              </div>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <button class="btn btn-xs btn-outline btn-rebook-appointment" 
                   data-name="${pName}" 
                   data-doc="${app.document || ''}"
                   data-phone="${app.phone || ''}"
                   data-email="${app.email || ''}"
                   data-reason="${app.reason || ''}"
                   data-modality="${app.modality || ''}"
                   data-grade="${patient ? (patient.grade || '') : ''}"
                   data-guardian="${patient ? (patient.guardian || '') : ''}">Agendar Nueva</button>
                <button class="btn btn-xs btn-danger btn-delete-permanent" data-id="${app.id}">Borrar Definitiva</button>
              </div>
            </div>
          `;
          historyGrid.appendChild(item);
        });
      }
    }
  }

  function renderPatients(patients) {
    const grid = document.getElementById('pacientesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    if (patients.length === 0) {
      grid.innerHTML = '<div style="text-align: center; padding: 2rem; grid-column: 1 / -1;">No hay pacientes registrados</div>';
      return;
    }

    patients.forEach(patient => {
      const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const card = document.createElement('article');
      card.className = 'patient-card';
      card.setAttribute('data-search', `${patient.name} ${patient.document} ${patient.phone} ${patient.email}`.toLowerCase());

      const gradeHtml = patient.grade ? `<span class="patient-doc-badge" style="background: #e2e8f0; color: #334155;">Grado: ${patient.grade}</span>` : '';

      card.innerHTML = `
        <div class="patient-header">
          <div class="patient-avatar">
            <span>${initials}</span>
          </div>
          <div class="patient-title-group">
            <h3 class="patient-card-name">${patient.name}</h3>
            <span class="patient-doc-badge">Doc: ${patient.document}</span>
            ${gradeHtml}
          </div>
        </div>
        <div class="patient-info-list">
          ${patient.guardian ? `
          <div class="info-item" style="color: #475569; font-weight: 500;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Acudiente: ${patient.guardian}</span>
          </div>
          ` : ''}
          <div class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>${patient.phone}</span>
          </div>
          <div class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>${patient.email || 'N/A'}</span>
          </div>
        </div>
        <div class="patient-actions">
          <button class="btn btn-xs btn-primary btn-view-detail" data-id="${patient.id}" data-name="${patient.name}">Ver / Editar Ficha</button>
        </div>
      `;
      grid.appendChild(card);
    });

    // Vincular botones de Ver Ficha
    const noteBtns = grid.querySelectorAll('.btn-view-detail');
    noteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById('patientNoteModal');
        const idInput = document.getElementById('patientNoteId');
        const nameTitle = document.getElementById('patientNoteName');
        const contentArea = document.getElementById('patientNoteContent');
        const historyList = document.getElementById('patientHistoryList');
        const infoDiv = document.getElementById('patientNoteInfo');
        const referralSelect = document.getElementById('patientNoteReferral');

        if (modal && idInput && nameTitle && contentArea) {
          const patientId = btn.getAttribute('data-id');
          const patient = patients.find(p => String(p.id) === String(patientId));
          idInput.value = patientId;
          nameTitle.textContent = `Ficha de: ${btn.getAttribute('data-name')}`;
          contentArea.value = patient && patient.notes ? patient.notes : '';
          if (referralSelect) referralSelect.value = patient && patient.referral ? patient.referral : '';
          
          if (infoDiv && patient) {
            infoDiv.innerHTML = `
              <strong>Documento:</strong> ${patient.document || 'N/A'}<br>
              <strong>Teléfono:</strong> ${patient.phone || 'N/A'}<br>
              <strong>Correo:</strong> ${patient.email || 'N/A'}<br>
              <strong>Grado:</strong> ${patient.grade || 'N/A'}<br>
              <strong>Acudiente:</strong> ${patient.guardian || 'N/A'}<br>
              <strong style="color: #ef4444;">Alergias:</strong> <span style="color: #ef4444;">${patient.allergies || 'Ninguna / No reportada'}</span>
            `;
            infoDiv.style.display = 'block';
            const btnToggleEditInfo = document.getElementById('btnToggleEditInfo');
            const patientEditInfoForm = document.getElementById('patientEditInfoForm');
            if (btnToggleEditInfo) btnToggleEditInfo.style.display = 'inline-block';
            if (patientEditInfoForm) patientEditInfoForm.style.display = 'none';
          } else if (infoDiv) {
            infoDiv.style.display = 'none';
          }
          
          const btnEdit = document.getElementById('btnEditPatientNotes');
          if (patient && patient.notes && patient.notes.trim() !== '') {
            contentArea.readOnly = true;
            contentArea.style.backgroundColor = '#f1f5f9';
            if (btnEdit) btnEdit.style.display = 'inline-block';
          } else {
            contentArea.readOnly = false;
            contentArea.style.backgroundColor = '';
            if (btnEdit) btnEdit.style.display = 'none';
          }
          
          if (historyList) {
            const patientName = btn.getAttribute('data-name') || '';
            const nameParts = patientName.trim().split(' ').filter(Boolean);
            let firstName = patientName;
            let lastName = '';
            if (nameParts.length === 2) {
              firstName = nameParts[0];
              lastName = nameParts[1];
            } else if (nameParts.length === 3) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else if (nameParts.length >= 4) {
              firstName = nameParts.slice(0, 2).join(' ');
              lastName = nameParts.slice(2).join(' ');
            }
            
            const historyHtml = window.currentAppointments
              .filter(a => String(a.patient_id) === String(patientId) && (a.status === 'cancelled' || a.status === 'confirmed'))
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((a, index, array) => `<div style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>Cita ${array.length - index} | ${a.date} ${a.time_start.substring(0,5)}</strong> - <span style="text-transform: capitalize;">${a.modality}</span>
                  <br><span style="color: #64748b;">Motivo: ${a.reason}</span>
                  <br><span style="color: #64748b; font-style: italic;">Estado: ${a.status === 'pending' ? 'Por Confirmar' : a.status === 'confirmed' ? 'Confirmada' : a.status}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                  <button type="button" class="btn btn-xs btn-outline" style="font-size: 0.7rem; padding: 0.15rem 0.4rem;" onclick="
                    document.getElementById('patientNoteModal').classList.remove('active');
                    const m = document.getElementById('newAppointmentModal');
                    if(m){ 
                      m.classList.add('active'); 
                      if(document.getElementById('newPatientName')) document.getElementById('newPatientName').value = '${firstName}'; 
                      if(document.getElementById('newPatientLastName')) document.getElementById('newPatientLastName').value = '${lastName}'; 
                      if(document.getElementById('newPatientDoc')) document.getElementById('newPatientDoc').value = '${a.document || ''}'; 
                      if(document.getElementById('newPatientPhone')) document.getElementById('newPatientPhone').value = '${a.phone || ''}'; 
                      if(document.getElementById('newPatientEmail')) document.getElementById('newPatientEmail').value = '${a.email || ''}'; 
                      if(document.getElementById('newPatientGrade')) document.getElementById('newPatientGrade').value = '${patient.grade || ''}'; 
                      if(document.getElementById('newPatientGuardian')) document.getElementById('newPatientGuardian').value = '${patient.guardian || ''}'; 
                      if(document.getElementById('newAppointmentReason')) document.getElementById('newAppointmentReason').value = '${(a.reason || '').replace(/'/g, "\\'")}'; 
                      const mod = document.getElementById('newAppointmentModality');
                      if(mod) { Array.from(mod.options).forEach(opt => { if(opt.value.toLowerCase() === '${(a.modality || '').toLowerCase()}') opt.selected = true; }); }
                    }
                  ">Agendar</button>
                  <button type="button" class="btn btn-xs btn-danger" style="font-size: 0.7rem; padding: 0.15rem 0.4rem;" onclick="
                    if(confirm('¿Borrar definitivamente?')) {
                      window.apiFetch('/api/appointments/${a.id}', {method: 'DELETE'}).then(res => {
                        if(res && res.success) { document.getElementById('patientNoteModal').classList.remove('active'); window.fetchAndRenderData(); }
                      });
                    }
                  ">Borrar</button>
                </div>
              </div>`)
              .join('');
            
            historyList.innerHTML = historyHtml || '<div style="text-align: center; color: #64748b; font-size: 0.85rem; padding: 0.5rem;">No hay citas previas.</div>';
          }

          modal.classList.add('active');
        }
      });
    });
  }

  // Cerrar Modal de Ficha
  const btnCloseNoteModal = document.getElementById('btnCloseNoteModal');
  if (btnCloseNoteModal) {
    btnCloseNoteModal.addEventListener('click', () => {
      document.getElementById('patientNoteModal').classList.remove('active');
    });
  }
  
  // Editar Notas en Modal
  const btnEditNotes = document.getElementById('btnEditPatientNotes');
  if (btnEditNotes) {
    btnEditNotes.addEventListener('click', () => {
      const contentArea = document.getElementById('patientNoteContent');
      if (contentArea) {
        contentArea.readOnly = false;
        contentArea.style.backgroundColor = '';
        contentArea.focus();
        btnEditNotes.style.display = 'none';
      }
    });
  }

  // Editar Datos del Paciente (Mostrar/Ocultar Formulario)
  const btnToggleEditInfo = document.getElementById('btnToggleEditInfo');
  const btnCancelEditInfo = document.getElementById('btnCancelEditInfo');
  const btnSaveEditInfo = document.getElementById('btnSaveEditInfo');
  const patientNoteInfo = document.getElementById('patientNoteInfo');
  const patientEditInfoForm = document.getElementById('patientEditInfoForm');

  if (btnToggleEditInfo) {
    btnToggleEditInfo.addEventListener('click', () => {
      const patientId = document.getElementById('patientNoteId').value;
      const patient = (window.currentPatients || []).find(p => String(p.id) === String(patientId));
      if (patient) {
        document.getElementById('editPatientDoc').value = patient.document || '';
        document.getElementById('editPatientPhone').value = patient.phone || '';
        document.getElementById('editPatientEmail').value = patient.email || '';
        document.getElementById('editPatientGrade').value = patient.grade || '';
        document.getElementById('editPatientGuardian').value = patient.guardian || '';
        const allergiesInput = document.getElementById('editPatientAllergies');
        if (allergiesInput) allergiesInput.value = patient.allergies || '';
        
        patientNoteInfo.style.display = 'none';
        patientEditInfoForm.style.display = 'block';
        btnToggleEditInfo.style.display = 'none';
      }
    });
  }

  if (btnCancelEditInfo) {
    btnCancelEditInfo.addEventListener('click', () => {
      patientNoteInfo.style.display = 'block';
      patientEditInfoForm.style.display = 'none';
      btnToggleEditInfo.style.display = 'inline-block';
    });
  }

  if (btnSaveEditInfo) {
    btnSaveEditInfo.addEventListener('click', async () => {
      const patientId = document.getElementById('patientNoteId').value;
      const data = {
        document: document.getElementById('editPatientDoc').value,
        phone: document.getElementById('editPatientPhone').value,
        email: document.getElementById('editPatientEmail').value,
        grade: document.getElementById('editPatientGrade').value,
        guardian: document.getElementById('editPatientGuardian').value,
        allergies: document.getElementById('editPatientAllergies') ? document.getElementById('editPatientAllergies').value : ''
      };
      
      try {
        const result = await apiFetch(`/api/patients/${patientId}/info`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        if (result && result.success) {
          showToast('Datos actualizados', 'success');
          patientEditInfoForm.style.display = 'none';
          btnToggleEditInfo.style.display = 'inline-block';
          // Actualizamos la vista local
          const patient = (window.currentPatients || []).find(p => String(p.id) === String(patientId));
          if (patient) {
            patient.document = data.document;
            patient.phone = data.phone;
            patient.email = data.email;
            patient.grade = data.grade;
            patient.guardian = data.guardian;
            patient.allergies = data.allergies;
            
            patientNoteInfo.innerHTML = `
              <strong>Documento:</strong> ${patient.document || 'N/A'}<br>
              <strong>Teléfono:</strong> ${patient.phone || 'N/A'}<br>
              <strong>Correo:</strong> ${patient.email || 'N/A'}<br>
              <strong>Grado:</strong> ${patient.grade || 'N/A'}<br>
              <strong>Acudiente:</strong> ${patient.guardian || 'N/A'}<br>
              <strong style="color: #ef4444;">Alergias:</strong> <span style="color: #ef4444;">${patient.allergies || 'Ninguna / No reportada'}</span>
            `;
            patientNoteInfo.style.display = 'block';
          }
          fetchAndRenderData(); // refresh in background
        }
      } catch (err) {
        showToast('Error al actualizar datos', 'danger');
      }
    });
  }

  // Guardar Modal de Ficha
  const patientNoteForm = document.getElementById('patientNoteForm');
  if (patientNoteForm) {
    patientNoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('patientNoteId').value;
      const notes = document.getElementById('patientNoteContent').value;
      const referral = document.getElementById('patientNoteReferral').value;
      try {
        const result = await apiFetch(`/api/patients/${id}/notes`, {
          method: 'PUT',
          body: JSON.stringify({ notes, referral })
        });
        if (result && result.success) {
          showToast('Ficha de estudiante guardada', 'success');
          document.getElementById('patientNoteModal').classList.remove('active');
          
          if (referral) {
            const patientName = document.getElementById('patientNoteName').textContent.replace('Ficha de: ', '').trim();
            const reminderText = `Hacer seguimiento de remisión a ${referral} para el estudiante ${patientName}.`;
            const reminders = getReminders();
            if (!reminders.some(r => r.text === reminderText)) {
              reminders.push({ text: reminderText });
              saveReminders(reminders);
              renderReminders();
              showToast('Recordatorio de seguimiento de remisión añadido automáticamente.', 'info');
            }
          }
          
          fetchAndRenderData();
        }
      } catch (err) {
        showToast('Error al guardar la ficha', 'danger');
      }
    });
  }

  // Lógica de Cerrar Sesión
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem(tokenKey);
      showToast('Sesión cerrada correctamente', 'info');
      const agendaGrid = document.getElementById('agendaGrid');
      const pacientesGrid = document.getElementById('pacientesGrid');
      if(agendaGrid) agendaGrid.innerHTML = '';
      if(pacientesGrid) pacientesGrid.innerHTML = '';
      if (loginOverlay) loginOverlay.classList.add('active');
      document.getElementById('appMainContent').style.display = 'none';
    });
  }

  // Inicializar contadores de tarjetas
  updateFilterCounts();
  
  // --------------------------------------------------------------------------
  // 7. GESTIÓN DE RECORDATORIOS PERSONALIZADOS
  // --------------------------------------------------------------------------
  const newReminderInput = document.getElementById('newReminderInput');
  const btnAddReminder = document.getElementById('btnAddReminder');
  const recordatoriosGrid = document.getElementById('recordatoriosGrid');

  function getReminders() {
    return JSON.parse(localStorage.getItem('neuro_reminders') || '[]');
  }

  function saveReminders(reminders) {
    localStorage.setItem('neuro_reminders', JSON.stringify(reminders));
  }

  function renderReminders() {
    if (!recordatoriosGrid) return;
    const reminders = getReminders();
    recordatoriosGrid.innerHTML = '';

    if (reminders.length === 0) {
      recordatoriosGrid.innerHTML = '<div style="text-align: center; color: #64748b; grid-column: 1 / -1; padding: 2rem;">No hay recordatorios pendientes.</div>';
      return;
    }

    reminders.forEach((rem, index) => {
      const card = document.createElement('div');
      card.className = 'reminder-card reminder-warning';
      card.innerHTML = `
        <div class="reminder-header">
          <div class="reminder-icon-box icon-warning">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div class="reminder-title-area">
            <span class="reminder-badge priority-pending">Tarea Pendiente</span>
            <h3 class="reminder-title">${rem.text}</h3>
          </div>
        </div>
        <div class="reminder-footer" style="justify-content: flex-end; margin-top: 1rem;">
          <button class="btn btn-xs btn-secondary btn-delete-reminder" data-index="${index}">Completar / Borrar</button>
        </div>
      `;
      recordatoriosGrid.appendChild(card);
    });

    const deleteBtns = recordatoriosGrid.querySelectorAll('.btn-delete-reminder');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        const currentReminders = getReminders();
        currentReminders.splice(index, 1);
        saveReminders(currentReminders);
        renderReminders();
        showToast('Recordatorio completado.', 'success');
      });
    });
  }

  if (btnAddReminder && newReminderInput) {
    btnAddReminder.addEventListener('click', () => {
      const text = newReminderInput.value.trim();
      if (text) {
        const reminders = getReminders();
        reminders.push({ text: text });
        saveReminders(reminders);
        newReminderInput.value = '';
        renderReminders();
        showToast('Recordatorio añadido.', 'success');
      } else {
        showToast('Escribe algo para el recordatorio.', 'warning');
      }
    });

    newReminderInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        btnAddReminder.click();
      }
    });
  }

  renderReminders();
  
  // Re-exponer apiFetch globalmente si se necesita en otros handlers
  window.apiFetch = apiFetch;
  window.fetchAndRenderData = fetchAndRenderData;
});
