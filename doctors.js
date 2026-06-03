/* =====================================================================
 * doctors.js — Doctor dashboards
 * كود الأطباء: لوحة الطبيب (الحجوزات، الإحصائيات، المحادثة مع المرضى).
 * NOTE: loaded as a classic <script defer> AFTER page.js — shares the
 * same global scope (helpers like escapeHtml/showToast/sbClient/currentUser
 * are defined in page.js).
 * ===================================================================== */

/* ========== DOCTOR DASHBOARD (live Supabase, filtered by own appointments) ========== */

  // ===========================
  // DOCTOR DASHBOARD (Live Supabase — filtered by own appointments)
  // ===========================
  let _docStatusFilter = 'pending';
  let _docSearchQuery = '';
  let _docDateFilter = 'all';

  window.docSetFilter = function(f) {
    _docStatusFilter=f;
    document.querySelectorAll('.doc-filter-tab').forEach(btn=>{
      const a=btn.id==='docFilter-'+f;
      if(a){btn.classList.add('bg-brand-600','text-white');btn.classList.remove('text-slate-400');}
      else{btn.classList.remove('bg-brand-600','text-white');btn.classList.add('text-slate-400');}
    });
    fetchAndRenderPendingAppts();
  };

  window.docSearchPatients = function(query) {
    _docSearchQuery = query.trim().toLowerCase();
    fetchAndRenderPendingAppts();
  };

  window.docSetDateFilter = function(filter) {
    _docDateFilter = filter;
    fetchAndRenderPendingAppts();
  };

  async function fetchAndRenderDocStats() {
    if (!currentUser?.email) return;
    const myProfile=getMyDoctorProfile(currentUser.email);
    const myName=myProfile?.display_name||currentUser.user_metadata?.full_name||currentUser.email.split('@')[0];
    const viewOwn=myProfile?.permissions?.view_own_only!==false;
    try {
      const today=new Date().toISOString().slice(0,10);
      let q1=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','approved');
      let q2=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','postponed');
      let q3=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','cancelled');
      let q4=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('preferred_date',today);
      let q5=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','pending');
      let q6=sbClient.from('appointments').select('*',{count:'exact',head:true});
      if(viewOwn){
        [q1,q2,q3,q4,q5,q6].forEach(q=>q.eq('doctor_name',myName));
      }
      const[r1,r2,r3,r4,r5,r6]=await Promise.all([q1,q2,q3,q4,q5,q6]);
      const sv=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??0;};
      sv('docStatToday',r4.count??0);sv('docStatPending',r5.count??0);sv('docStatApproved',r1.count??0);
      sv('docStatPostponed',r2.count??0);sv('docStatCancelled',r3.count??0);sv('docStatTotal',r6.count??0);
      const dn=document.getElementById('docDashName');if(dn)dn.textContent=myName;
      const ds=document.getElementById('docDashSpecialty');if(ds)ds.textContent='Doctor Dashboard \u00b7 '+(myProfile?.specialty||'Specialist');
    } catch(err){console.error('fetchDocStats:',err);}
  }

  function _getDateRange(filter) {
    const now=new Date();
    const startOfDay=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    if(filter==='today') return {gte:startOfDay.toISOString()};
    if(filter==='week'){
      const weekStart=new Date(startOfDay);
      weekStart.setDate(weekStart.getDate()-weekStart.getDay());
      return {gte:weekStart.toISOString()};
    }
    if(filter==='month'){
      const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
      return {gte:monthStart.toISOString()};
    }
    return null;
  }

  async function fetchAndRenderPendingAppts() {
    const container=document.getElementById('pendingAppts');
    if(!container||!currentUser?.email)return;
    const myProfile=getMyDoctorProfile(currentUser.email);
    const myName=myProfile?.display_name||currentUser.user_metadata?.full_name||currentUser.email.split('@')[0];
    const viewOwn=myProfile?.permissions?.view_own_only!==false;
    const canApprove=myProfile?.permissions?.can_approve!==false;
    const canCancel=myProfile?.permissions?.can_cancel!==false;
    container.innerHTML='<div class="flex items-center justify-center py-8 gap-3 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading...</span></div>';
    try{
      let q=sbClient.from('appointments').select('*').order('created_at',{ascending:false}).limit(60);
      if(_docStatusFilter!=='all')q=q.eq('status',_docStatusFilter);
      if(viewOwn)q=q.eq('doctor_name',myName);
      const dRange=_getDateRange(_docDateFilter);
      if(dRange)q=q.gte('preferred_date',dRange.gte);
      const{data:appts,error}=await q;if(error)throw error;
      let filtered=appts||[];
      if(_docSearchQuery){
        filtered=filtered.filter(a=>(a.patient_name||'').toLowerCase().includes(_docSearchQuery));
      }
      if(!filtered.length){
        container.innerHTML='<div class="text-center py-8"><div class="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-check-double text-green-400 text-xl"></i></div><p class="text-sm text-slate-400">No appointments found</p></div>';
        return;
      }
      const sCls={pending:'bg-gold-500/15 border-gold-500/30 text-gold-300',approved:'bg-green-500/15 border-green-500/30 text-green-300',postponed:'bg-blue-500/15 border-blue-500/30 text-blue-300',cancelled:'bg-red-500/15 border-red-500/30 text-red-300'};
      container.innerHTML=filtered.map(appt=>{
        const dt = appt.preferred_date
          ? new Date(appt.preferred_date + 'T12:00:00').toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'})
          : null;
        const age=appt.patient_age?`${appt.patient_age} yrs`:'-'; const gender=appt.patient_gender?capitalize(appt.patient_gender):'-';
        const initial=(appt.patient_name||'P').charAt(0).toUpperCase();
        const s=safeStatus(appt.status);
        const badge=`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${sCls[s]||sCls.pending}">${capitalize(s)}</span>`;
        const specLabel=escapeHtml(capitalize(appt.specialty||''));
        let btns='';
        if(s==='pending'){if(canApprove)btns+=`<button onclick="confirmAndHandleAppt(${jsArg(appt.id)},${jsArg('approved')},${jsArg(appt.patient_email)})" class="px-2.5 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 text-[11px] font-medium hover:bg-green-500/30 transition-colors"><i class="fas fa-check mr-1"></i>Approve</button>`;if(canCancel)btns+=`<button onclick="confirmAndHandleAppt(${jsArg(appt.id)},${jsArg('postponed')},${jsArg(appt.patient_email)})" class="px-2.5 py-1.5 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-300 text-[11px] font-medium hover:bg-gold-500/30 transition-colors"><i class="fas fa-clock mr-1"></i>Postpone</button>`;}
        else if(s==='approved'&&canCancel)btns+=`<button onclick="confirmAndHandleAppt(${jsArg(appt.id)},${jsArg('cancelled')},${jsArg(appt.patient_email)})" class="px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-medium hover:bg-red-500/30 transition-colors"><i class="fas fa-times mr-1"></i>Cancel</button>`;
        const chatBtn=`<button onclick="openDocChatForAppt(${jsArg(appt.id)},${jsArg(appt.patient_name)},${jsArg(appt.patient_email)})" class="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[11px] font-medium hover:text-white hover:bg-white/10 transition-colors"><i class="fas fa-comment mr-1"></i>Chat</button>`;
        const viewBtn=`<button onclick="openPatientQuickView(${jsArg(JSON.stringify(appt))})" class="px-2.5 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-medium hover:bg-brand-500/20 transition-colors"><i class="fas fa-eye mr-1"></i>View</button>`;
        return `<div class="glass border border-white/8 rounded-2xl p-3.5 mb-3" id="appt-${escapeHtml(appt.id)}">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0 mt-0.5">${escapeHtml(initial)}</div>
            <div class="flex-1 min-w-0 space-y-1.5">

              <!-- Name + status -->
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-sm font-semibold text-white">${escapeHtml(appt.patient_name)}</span>${badge}
              </div>

              <!-- Preferred appointment date — highlighted row -->
              <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${dt ? 'bg-brand-500/10 border border-brand-500/25' : 'bg-white/3 border border-white/8'}">
                <i class="fas fa-calendar-check ${dt ? 'text-brand-400' : 'text-slate-600'} text-xs flex-shrink-0"></i>
                <span class="text-xs font-semibold ${dt ? 'text-brand-300' : 'text-slate-500'}">${dt ? escapeHtml(dt) : 'No date selected'}</span>
              </div>

              <!-- Demographics -->
              <div class="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                <span><i class="fas fa-user mr-1 text-slate-600"></i>${escapeHtml(age)}</span>
                <span><i class="fas fa-venus-mars mr-1 text-slate-600"></i>${escapeHtml(gender)}</span>
                ${specLabel ? `<span><i class="fas fa-stethoscope mr-1 text-slate-600"></i>${specLabel}</span>` : ''}
              </div>

              <!-- Contact -->
              ${(appt.phone||appt.patient_email) ? `<div class="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                ${appt.phone ? `<span><i class="fas fa-phone mr-1 text-brand-400/60"></i>${escapeHtml(appt.phone)}</span>` : ''}
                ${appt.patient_email ? `<span><i class="fas fa-envelope mr-1 text-brand-400/60"></i>${escapeHtml(appt.patient_email)}</span>` : ''}
              </div>` : ''}

              <!-- Notes — full text -->
              ${appt.notes ? `<div class="text-[11px] text-slate-300 bg-white/3 border border-white/8 rounded-xl px-2.5 py-2 leading-relaxed"><i class="fas fa-comment-medical mr-1 text-brand-400/60"></i>${escapeHtml(appt.notes)}</div>` : ''}

            </div>
            <div class="flex flex-col gap-1.5 flex-shrink-0 min-w-[80px]">
              ${btns}${chatBtn}${viewBtn}
            </div>
          </div>
        </div>`;
      }).join('');
    }catch(errD){
      container.innerHTML=`<div class="flex items-center gap-2 text-red-400 text-sm p-4 glass border border-red-500/20 rounded-xl"><i class="fas fa-exclamation-circle"></i><span>${escapeHtml(errD.message)}</span></div>`;
    }
  }

  window.handleAppt = async function(appointmentId, action, patientEmail) {
    const el = document.getElementById('appt-' + appointmentId);
    if (!el) return;
    el.querySelectorAll('button').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });

    try {
      const { error: updateErr } = await sbClient
        .from('appointments')
        .update({ status: action })
        .eq('id', appointmentId);
      if (updateErr) throw updateErr;

      try {
        const { error: invokeErr } = await sbClient.functions.invoke('notify-appointment', { body: { appointmentId, action } });
        if (invokeErr) throw invokeErr;
        showToast(`Appointment ${action} successfully! Patient notified.`, 'success');
      } catch (notifyErr) {
        console.warn('Notification failed, using DB fallback:', notifyErr);
        await sbClient.from('notifications').insert({ appointment_id: appointmentId, action, status: 'pending' });
        showToast(`Appointment ${action}! Notification pending.`, 'success');
      }
      
      await fetchAndRenderPendingAppts();
      await fetchAndRenderDocStats();
    } catch (err) {
      console.error('handleAppt error:', err);
      if (el) el.querySelectorAll('button').forEach(b => { b.disabled = false; b.style.opacity = '1'; });
      showToast('Action failed: ' + err.message, 'error');
    }
  };

  window.confirmAndHandleAppt = function(appointmentId, action, patientEmail) {
    const titles = {approved:'Approve Appointment', postponed:'Postpone Appointment', cancelled:'Cancel Appointment'};
    const icons = {approved:'fa-check-circle text-green-400 bg-green-500/20', postponed:'fa-clock text-gold-400 bg-gold-500/20', cancelled:'fa-times-circle text-red-400 bg-red-500/20'};
    const msgs = {approved:'Confirm approving this appointment? The patient will be notified.', postponed:'Confirm postponing this appointment? The patient will be notified.', cancelled:'Confirm cancelling this appointment? The patient will be notified.'};
    const icon=icons[action]||icons.cancelled;
    const iconEl=document.getElementById('confirmIcon');
    iconEl.className='w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center '+icon.split(' ').slice(2).join(' ');
    document.getElementById('confirmIconEl').className='fas '+icon.split(' ')[0]+' text-2xl';
    document.getElementById('confirmTitle').textContent=titles[action]||'Confirm Action';
    document.getElementById('confirmMsg').textContent=msgs[action]||'Are you sure?';
    const btn=document.getElementById('confirmProceedBtn');
    btn.onclick=function(){
      closeModal('confirmActionModal');
      handleAppt(appointmentId, action, patientEmail);
    };
    openModal('confirmActionModal');
  };

  window.openPatientQuickView = function(apptJson) {
    const appt = typeof apptJson === 'string' ? JSON.parse(apptJson) : apptJson;
    const initial=(appt.patient_name||'P').charAt(0).toUpperCase();
    document.getElementById('pvAvatar').textContent=initial;
    document.getElementById('pvPatientName').textContent=appt.patient_name||'Patient';
    document.getElementById('pvPatientEmail').textContent=appt.patient_email||'—';
    document.getElementById('pvPhone').textContent=appt.phone||'—';
    document.getElementById('pvGender').textContent=appt.patient_gender||'—';
    document.getElementById('pvAge').textContent=appt.patient_age?appt.patient_age+' yrs':'—';
    document.getElementById('pvSpecialty').textContent=appt.specialty||'—';

    // Preferred date — timezone-safe parsing
    const pvDateEl  = document.getElementById('pvDate');
    const pvDateBox = document.getElementById('pvDateBox');
    if (appt.preferred_date) {
      const dateStr = new Date(appt.preferred_date + 'T12:00:00').toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
      pvDateEl.textContent = dateStr;
      pvDateEl.className = 'font-semibold mt-1 text-brand-300';
      pvDateBox.className = 'rounded-xl p-3 border bg-brand-500/10 border-brand-500/25';
    } else {
      pvDateEl.textContent = 'No date selected';
      pvDateEl.className = 'font-semibold mt-1 text-slate-500';
      pvDateBox.className = 'rounded-xl p-3 border bg-white/3 border-white/8';
    }

    // Payment method
    const pmLabels = {card:'Visa / Mastercard', mir:'Mir Card', apple:'Apple Pay', cash:'Cash at Clinic'};
    const pmIcons  = {card:'fa-credit-card text-blue-400', mir:'fa-credit-card text-green-400', apple:'fa-apple text-slate-300', cash:'fa-money-bill-wave text-green-300'};
    const pm = safePaymentMethod(appt.payment_method);
    document.getElementById('pvPayment').innerHTML = `<i class="fas ${pmIcons[pm]||pmIcons.card} mr-1 text-xs"></i>${pmLabels[pm]||'Card'}`;

    const sCls={pending:'bg-gold-500/15 text-gold-300',approved:'bg-green-500/15 text-green-300',postponed:'bg-blue-500/15 text-blue-300',cancelled:'bg-red-500/15 text-red-300'};
    const status=(appt.status||'pending');
    document.getElementById('pvStatus').innerHTML=`<span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${sCls[status]||sCls.pending}">${capitalize(status)}</span>`;
    document.getElementById('pvNotes').textContent=appt.notes||'No notes';
    const actionsEl=document.getElementById('pvActions');
    if (status==='pending') {
      actionsEl.innerHTML=`<button onclick="closeModal('patientQuickViewModal');confirmAndHandleAppt(${jsArg(appt.id)},${jsArg('approved')},${jsArg(appt.patient_email)})" class="flex-1 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-colors"><i class="fas fa-check mr-1"></i>Approve</button><button onclick="closeModal('patientQuickViewModal');confirmAndHandleAppt(${jsArg(appt.id)},${jsArg('postponed')},${jsArg(appt.patient_email)})" class="flex-1 py-2 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-300 text-xs font-medium hover:bg-gold-500/30 transition-colors"><i class="fas fa-clock mr-1"></i>Postpone</button>`;
    } else {
      actionsEl.innerHTML=`<button onclick="closeModal('patientQuickViewModal')" class="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors"><i class="fas fa-times mr-1"></i>Close</button>`;
    }
    openModal('patientQuickViewModal');
  };

  window.openDocChatForAppt = function(apptId, patientName, patientEmail) {
    const tabsEl = document.getElementById('iDocChatPatientTabs');
    if (tabsEl) {
      loadInlineDocChat(apptId, patientName, patientEmail);
      tabsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };


/* ========== INLINE DOCTOR DASHBOARD — filters / stats / search ========== */

  // ===========================
  // INLINE DOCTOR DASHBOARD LOGIC
  // ===========================
  let _iDocStatusFilter = 'pending';
  window.iDocSetFilter = function(f) {
    _iDocStatusFilter = f;
    document.querySelectorAll('.i-doc-filter-tab').forEach(btn => {
      const active = btn.id==='iDocFilter-'+f;
      if(active){btn.classList.add('bg-brand-600','text-white');btn.classList.remove('text-slate-400');}
      else{btn.classList.remove('bg-brand-600','text-white');btn.classList.add('text-slate-400');}
    });
    loadInlineDocAppts();
  };

  async function loadInlineDocStats() {
    if (!currentUser?.email) return;
    const myProfile=getMyDoctorProfile(currentUser.email);
    const myName=myProfile?.display_name||currentUser.user_metadata?.full_name||currentUser.email.split('@')[0];
    const viewOwn=myProfile?.permissions?.view_own_only!==false;
    const today=new Date().toISOString().slice(0,10);
    try {
      let q1=sbClient.from('appointments').select('*',{count:'exact',head:true});
      let q2=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','pending');
      let q3=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('preferred_date',today);
      let q4=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','approved');
      let q5=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','postponed');
      let q6=sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','cancelled');
      if(viewOwn){[q1,q2,q3,q4,q5,q6].forEach(q=>q.eq('doctor_name',myName));}
      const[r1,r2,r3,r4,r5,r6]=await Promise.all([q1,q2,q3,q4,q5,q6]);
      const sv=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??0;};
      sv('iDocStatToday',r3.count??0); sv('iDocStatPending',r2.count??0); sv('iDocStatTotal',r1.count??0);
      sv('iDocStatApproved',r4.count??0); sv('iDocStatPostponed',r5.count??0); sv('iDocStatCancelled',r6.count??0);
      const dn=document.getElementById('iDocDashName'); if(dn)dn.textContent=myName;
      const ds=document.getElementById('iDocDashSpec'); if(ds)ds.textContent='Doctor Dashboard · '+(myProfile?.specialty||'Specialist');
    } catch(err){console.error(err);}
  }

  // Doctor search + date filter
  let _iDocSearchQuery = '';
  let _iDocDateFilterVal = 'all';
  window.iDocSearchPatients = function(q) {
    _iDocSearchQuery = q.trim().toLowerCase();
    loadInlineDocAppts();
  };
  window.iDocSetDateFilter = function(f) {
    _iDocDateFilterVal = f;
    loadInlineDocAppts();
  };


/* ========== INLINE DOCTOR DASHBOARD — appointments + chat ========== */

  window.loadInlineDocAppts = async function() {
    const container=document.getElementById('iDocApptsList');
    if(!container||!currentUser?.email) return;
    const myProfile=getMyDoctorProfile(currentUser.email);
    const myName=myProfile?.display_name||currentUser.user_metadata?.full_name||currentUser.email.split('@')[0];
    const viewOwn=myProfile?.permissions?.view_own_only!==false;
    const canApprove=myProfile?.permissions?.can_approve!==false;
    const canCancel=myProfile?.permissions?.can_cancel!==false;
    container.innerHTML='<div class="flex items-center justify-center py-8 gap-3 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading...</span></div>';
    try {
      let q=sbClient.from('appointments').select('*').order('created_at',{ascending:false}).limit(30);
      if(_iDocStatusFilter!=='all') q=q.eq('status',_iDocStatusFilter);
      if(viewOwn) q=q.eq('doctor_name',myName);
      const dRange=_getDateRange(_iDocDateFilterVal||'all');
      if(dRange) q=q.gte('preferred_date',dRange.gte);
      const{data:appts,error}=await q; if(error) throw error;
      let filtered = appts||[];
      if(_iDocSearchQuery) filtered = filtered.filter(a=>(a.patient_name||'').toLowerCase().includes(_iDocSearchQuery));
      if(!filtered.length){
        container.innerHTML='<div class="text-center py-8"><div class="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-check-double text-green-400 text-xl"></i></div><p class="text-sm text-slate-400">No appointments found</p></div>';
        return;
      }
      const statusBar  = {pending:'#f59e0b', approved:'#22c55e', postponed:'#3b82f6', cancelled:'#ef4444'};
      const statusCls  = {pending:'bg-gold-500/15 border-gold-500/30 text-gold-300', approved:'bg-green-500/15 border-green-500/30 text-green-300', postponed:'bg-blue-500/15 border-blue-500/30 text-blue-300', cancelled:'bg-red-500/15 border-red-500/30 text-red-300'};
      const avatarGrad = {pending:'#b45309,#92400e', approved:'#15803d,#166534', postponed:'#1d4ed8,#1e40af', cancelled:'#b91c1c,#991b1b', default:'#0e87a0,#14a8c0'};

      container.innerHTML = filtered.map(appt => {
        const dt = appt.preferred_date
          ? new Date(appt.preferred_date + 'T12:00:00').toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'})
          : null;
        const age = appt.patient_age ? `${appt.patient_age} yrs` : '—';
        const s   = safeStatus(appt.status);
        const initial = (appt.patient_name || 'P').charAt(0).toUpperCase();
        const grad = avatarGrad[s] || avatarGrad.default;
        const badge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusCls[s]||statusCls.pending}">${capitalize(s)}</span>`;
        const specLabel = escapeHtml(capitalize(appt.specialty || ''));

        // Action buttons
        let actionBtns = '';
        if (s === 'pending') {
          if (canApprove) actionBtns += `<button onclick="event.stopPropagation();iDocHandleAppt(${jsArg(appt.id)},${jsArg('approved')},${jsArg(appt.patient_email)})" class="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-semibold hover:bg-green-500/30 transition-colors"><i class="fas fa-check text-[10px]"></i>Approve</button>`;
          if (canCancel)  actionBtns += `<button onclick="event.stopPropagation();iDocHandleAppt(${jsArg(appt.id)},${jsArg('postponed')},${jsArg(appt.patient_email)})" class="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gold-500/20 border border-gold-500/40 text-gold-300 text-xs font-semibold hover:bg-gold-500/30 transition-colors"><i class="fas fa-clock text-[10px]"></i>Postpone</button>`;
        } else if (s === 'approved' && canCancel) {
          actionBtns += `<button onclick="event.stopPropagation();iDocHandleAppt(${jsArg(appt.id)},${jsArg('cancelled')},${jsArg(appt.patient_email)})" class="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-colors"><i class="fas fa-times text-[10px]"></i>Cancel</button>`;
        }

        return `<div class="rounded-2xl overflow-hidden mb-3 cursor-pointer hover:scale-[1.01] transition-all duration-200 group" id="i-doc-appt-${escapeHtml(appt.id)}" onclick="openApptDetail(${jsArg(JSON.stringify(appt))})">
          <!-- Colored accent bar -->
          <div style="height:3px;background:${statusBar[s]||'#6b7280'}"></div>

          <div class="glass border border-white/8 border-t-0 rounded-b-2xl p-4">
            <div class="flex items-start gap-3">
              <!-- Avatar -->
              <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg"
                style="background:linear-gradient(135deg,${grad.split(',')[0]},${grad.split(',')[1]})">
                ${escapeHtml(initial)}
              </div>

              <div class="flex-1 min-w-0">
                <!-- Name + Badge -->
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span class="text-sm font-extrabold text-white">${escapeHtml(appt.patient_name)}</span>
                  ${badge}
                </div>

                <!-- Date -->
                <div class="flex items-center gap-2 rounded-xl px-3 py-2 mb-2.5 ${dt ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-white/3 border border-white/8'}">
                  <i class="fas fa-calendar-check ${dt ? 'text-brand-400' : 'text-slate-600'} text-xs flex-shrink-0"></i>
                  <span class="text-xs font-bold ${dt ? 'text-brand-300' : 'text-slate-600'}">${dt ? escapeHtml(dt) : 'No date selected'}</span>
                </div>

                <!-- Info chips -->
                <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span class="flex items-center gap-1"><i class="fas fa-user text-slate-600 text-[10px]"></i>${escapeHtml(age)} · ${escapeHtml(capitalize(appt.patient_gender||'—'))}</span>
                  ${specLabel ? `<span class="flex items-center gap-1"><i class="fas fa-stethoscope text-slate-600 text-[10px]"></i>${specLabel}</span>` : ''}
                  ${appt.phone ? `<span class="flex items-center gap-1"><i class="fas fa-phone text-brand-400/60 text-[10px]"></i>${escapeHtml(appt.phone)}</span>` : ''}
                </div>

                ${appt.notes ? `<div class="mt-2.5 text-xs text-slate-400 bg-white/3 border border-white/5 rounded-xl px-3 py-2 leading-relaxed line-clamp-2"><i class="fas fa-comment-medical mr-1 text-brand-400/50"></i>${escapeHtml(appt.notes)}</div>` : ''}
              </div>
            </div>

            <!-- Bottom actions row -->
            <div class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
              ${actionBtns}
              <button onclick="event.stopPropagation();loadInlineDocChat(${jsArg(appt.id)},${jsArg(appt.patient_name)},${jsArg(appt.patient_email)});document.getElementById('iDocChatPatientTabs')?.scrollIntoView({behavior:'smooth',block:'nearest'})" class="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:text-white hover:bg-white/10 transition-colors"><i class="fas fa-comment text-[10px]"></i>Chat</button>
              <button onclick="openApptDetail(${jsArg(JSON.stringify(appt))})" class="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold hover:bg-brand-500/20 transition-colors group-hover:border-brand-500/40">
                View Details <i class="fas fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>`;
      }).join('');
    } catch(errD){
      container.innerHTML=`<div class="flex items-center gap-2 text-red-400 text-sm p-4 glass border border-red-500/20 rounded-xl"><i class="fas fa-exclamation-circle"></i><span>${escapeHtml(errD.message)}</span></div>`;
    }
  };

  window.iDocHandleAppt = async function(appointmentId, action, patientEmail) {
    const el = document.getElementById('i-doc-appt-' + appointmentId);
    if (el) el.querySelectorAll('button').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
    try {
      // 1. Update DB (Primary)
      const { error: updateErr } = await sbClient
        .from('appointments')
        .update({ status: action })
        .eq('id', appointmentId);
      if (updateErr) throw updateErr;

      // 2. Notify (Best Effort)
      try {
        const { error: invokeErr } = await sbClient.functions.invoke('notify-appointment', { body: { appointmentId, action } });
        if (invokeErr) throw invokeErr;
        showToast(`Appointment ${action} successfully!`, 'success');
      } catch (notifyErr) {
        await sbClient.from('notifications').insert({ appointment_id: appointmentId, action, status: 'pending' });
        showToast(`Appointment ${action}! Notification pending.`, 'success');
      }
      // 3. Reload
      await loadInlineDocStats(); await loadInlineDocAppts();
    } catch (err) {
      if (el) el.querySelectorAll('button').forEach(b => { b.disabled = false; b.style.opacity = '1'; });
      showToast('Action failed: ' + err.message, 'error');
    }
  };

  // Inline doctor chat functions
  let _iDocChatApptId = null;

  async function loadInlineDocChatTabs() {
    if (!currentUser?.email) return;
    const myProfile = getMyDoctorProfile(currentUser.email);
    const myName = myProfile?.display_name || currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
    const viewOwn = myProfile?.permissions?.view_own_only !== false;

    try {
      let q = sbClient.from('appointments').select('id, patient_name, patient_email').order('created_at', { ascending: false }).limit(20);
      if (viewOwn) q = q.eq('doctor_name', myName);
      const { data: appts, error } = await q;
      if (error) throw error;
      if (!appts || appts.length === 0) return;

      // Get message counts per appointment
      const tabsEl = document.getElementById('iDocChatPatientTabs');
      const msgCounts = {};
      try {
        const { data: msgs } = await sbClient.from('messages').select('appointment_id').eq('sender_role', 'patient');
        if (msgs) msgs.forEach(m => { msgCounts[m.appointment_id] = (msgCounts[m.appointment_id]||0) + 1; });
      } catch(e) { /* best effort */ }

      tabsEl.innerHTML = appts.map(a => {
        const safeName = escapeHtml(a.patient_name || 'Patient');
        const cls = _iDocChatApptId === a.id ? 'bg-brand-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10';
        const unread = msgCounts[a.id] || 0;
        const badge = unread > 0 ? `<span class="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center inline-flex">${unread>9?'9+':unread}</span>` : '';
        return `<button onclick="loadInlineDocChat(${jsArg(a.id)}, ${jsArg(a.patient_name)}, ${jsArg(a.patient_email)})" class="i-doc-chat-tab px-3 py-1.5 rounded-full text-xs font-medium ${cls} transition-all whitespace-nowrap flex items-center"><i class="fas fa-user mr-1"></i>${safeName}${badge}</button>`;
      }).join('');
    } catch (err) {
      console.warn('loadInlineDocChatTabs:', err);
    }
  }

  window.loadInlineDocChat = async function(apptId, patientName, patientEmail) {
    _iDocChatApptId = apptId;

    // Update tab styles
    document.querySelectorAll('.i-doc-chat-tab').forEach(btn => {
      const isActive = (btn.getAttribute('onclick') || '').includes(`'${apptId}'`);
      if (isActive) { btn.classList.add('bg-brand-600', 'text-white'); btn.classList.remove('bg-white/5', 'text-slate-400', 'hover:bg-white/10'); }
      else { btn.classList.remove('bg-brand-600', 'text-white'); btn.classList.add('bg-white/5', 'text-slate-400', 'hover:bg-white/10'); }
    });

    const container = document.getElementById('iDocChatMessages');
    container.innerHTML = '<div class="flex items-center justify-center py-6 gap-2 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading messages...</span></div>';

    const messages = await loadChatMessages(apptId);
    if (messages.length === 0) {
      container.innerHTML = '<div class="text-center py-10 text-slate-500 text-sm"><i class="fas fa-comment-dots block text-2xl mb-2 text-brand-500/20"></i>No messages yet with ' + escapeHtml(patientName) + '</div>';
      return;
    }

    container.innerHTML = _renderChatMessages(messages, 'doctor');
    container.scrollTop = container.scrollHeight;
  };

  window.sendIinlineDocChat = async function() {
    const input = document.getElementById('iDocChatInput');
    const msg = input.value.trim();
    if (!msg || !_iDocChatApptId) return;
    const container = document.getElementById('iDocChatMessages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    container.innerHTML += `<div class="flex justify-end mt-2"><div class="msg-out px-4 py-2.5"><div class="text-sm leading-relaxed">${escapeHtml(msg)}</div><div class="flex items-center justify-end gap-1 mt-1.5"><span class="text-[10px] text-white/50">${time}</span><i class="fas fa-circle-notch fa-spin text-[9px] text-white/40 ml-0.5"></i></div></div></div>`;
    input.value = '';
    container.scrollTop = container.scrollHeight;

    const senderEmail = currentUser.email;
    const senderRole = isAdmin(currentUser.email) ? 'admin' : 'doctor';
    const saved = await sendChatMessageToDB(_iDocChatApptId, senderEmail, senderRole, msg);
    const lastMsg = container.querySelector('.flex.justify-end:last-child .fa-circle-notch');
    if (lastMsg) lastMsg.className = saved ? 'fas fa-check text-[9px] text-slate-400' : 'fas fa-times text-[9px] text-red-400';
    if (!saved) {
      container.innerHTML += `<div class="text-center py-2 text-red-400 text-xs">Failed to send message</div>`;
    }
  };

  // Admin state

/* ========== APPOINTMENT DETAIL MODAL (opened from the doctor dashboard) ========== */

  // ===========================
  // APPOINTMENT DETAIL MODAL
  // ===========================
  window.openApptDetail = function(apptJson) {
    const a = typeof apptJson === 'string' ? JSON.parse(apptJson) : apptJson;
    const s = safeStatus(a.status);

    // Status config
    const sc = {
      pending:   { bg:'linear-gradient(135deg,rgba(120,53,15,.7),rgba(92,45,12,.5))',   color:'#f59e0b', label:'PENDING',   icon:'fa-clock' },
      approved:  { bg:'linear-gradient(135deg,rgba(20,83,45,.7),rgba(21,128,61,.4))',   color:'#22c55e', label:'APPROVED',  icon:'fa-check-circle' },
      postponed: { bg:'linear-gradient(135deg,rgba(30,58,138,.7),rgba(29,78,216,.4))',  color:'#3b82f6', label:'POSTPONED', icon:'fa-redo' },
      cancelled: { bg:'linear-gradient(135deg,rgba(127,29,29,.7),rgba(185,28,28,.4))',  color:'#ef4444', label:'CANCELLED', icon:'fa-times-circle' },
      completed: { bg:'linear-gradient(135deg,rgba(88,28,135,.7),rgba(126,34,206,.4))', color:'#a855f7', label:'COMPLETED', icon:'fa-star' },
    }[s] || { bg:'linear-gradient(135deg,rgba(30,48,80,.7),rgba(14,135,160,.4))', color:'#14a8c0', label:s.toUpperCase(), icon:'fa-circle' };

    // Header gradient + badge
    const headerEl = document.getElementById('admHeader');
    if (headerEl) headerEl.style.background = sc.bg;
    const badgeEl = document.getElementById('admStatusBadge');
    if (badgeEl) badgeEl.innerHTML = `<i class="fas ${sc.icon} text-[10px]"></i>${sc.label}`;

    // Avatar
    const initial = (a.patient_name || 'P').charAt(0).toUpperCase();
    const avatarEl = document.getElementById('admAvatar');
    if (avatarEl) {
      avatarEl.textContent = initial;
      avatarEl.style.background = `linear-gradient(135deg, ${sc.color}cc, ${sc.color}66)`;
    }

    // Patient info
    const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val || '—'; };
    setEl('admPatientName', a.patient_name);
    setEl('admPatientEmail', a.patient_email);
    setEl('admPhone', a.phone);
    setEl('admAge', a.patient_age ? a.patient_age + ' yrs' : '—');
    setEl('admGender', capitalize(a.patient_gender || ''));
    setEl('admSpecialty', capitalize(a.specialty || ''));
    setEl('admDoctor', a.doctor_name || 'TBD');

    // Date
    const dateEl    = document.getElementById('admDate');
    const dateBoxEl = document.getElementById('admDateBox');
    if (a.preferred_date) {
      const ds = new Date(a.preferred_date + 'T12:00:00').toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
      if (dateEl) dateEl.textContent = ds;
      if (dateBoxEl) {
        dateBoxEl.style.background = 'rgba(20,168,192,0.1)';
        dateBoxEl.style.border = '1px solid rgba(20,168,192,0.3)';
        dateBoxEl.querySelector('div').style.color = '#2fc4da';
      }
    } else {
      if (dateEl) dateEl.textContent = 'No date selected';
      if (dateBoxEl) {
        dateBoxEl.style.background = 'rgba(255,255,255,0.03)';
        dateBoxEl.style.border = '1px solid rgba(255,255,255,0.08)';
        dateBoxEl.querySelector('div').style.color = '#64748b';
      }
    }

    // Payment
    const pmLabels = {card:'Visa / Mastercard', mir:'Mir Card', apple:'Apple Pay', cash:'Cash at Clinic'};
    const pmIcons  = {card:'fa-credit-card text-blue-400', mir:'fa-credit-card text-green-400', apple:'fa-apple text-slate-300', cash:'fa-money-bill-wave text-green-400'};
    const pm = safePaymentMethod(a.payment_method);
    const payEl = document.getElementById('admPayment');
    if (payEl) payEl.innerHTML = `<i class="fas ${pmIcons[pm]||pmIcons.card} mr-2"></i>${pmLabels[pm]||'Card'}`;

    // Booked at
    const bookedEl = document.getElementById('admBookedAtBadge');
    if (bookedEl && a.created_at) bookedEl.textContent = 'Booked ' + new Date(a.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});

    // Notes
    const notesBoxEl = document.getElementById('admNotesBox');
    const notesEl    = document.getElementById('admNotes');
    if (a.notes && a.notes.trim()) {
      if (notesBoxEl) notesBoxEl.classList.remove('hidden');
      if (notesEl)    notesEl.textContent = a.notes;
    } else {
      if (notesBoxEl) notesBoxEl.classList.add('hidden');
    }

    // Actions
    const actionsEl = actionsEl2 = document.getElementById('admActions');
    if (actionsEl) {
      const myProfile  = isDoctor(currentUser?.email) ? getMyDoctorProfile(currentUser.email) : null;
      const canApprove = myProfile ? myProfile.permissions?.can_approve !== false : true;
      const canCancel  = myProfile ? myProfile.permissions?.can_cancel  !== false : true;
      const isAdm      = isAdmin(currentUser?.email);
      let btns = '';

      if (s === 'pending') {
        if (canApprove || isAdm) btns += `<button onclick="closeModal('apptDetailModal');confirmAndHandleAppt(${jsArg(a.id)},${jsArg('approved')},${jsArg(a.patient_email)})" class="flex-1 py-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm font-bold hover:bg-green-500/30 transition-colors"><i class="fas fa-check mr-1.5"></i>Approve</button>`;
        if (canCancel  || isAdm) btns += `<button onclick="closeModal('apptDetailModal');confirmAndHandleAppt(${jsArg(a.id)},${jsArg('postponed')},${jsArg(a.patient_email)})" class="flex-1 py-2.5 rounded-xl bg-gold-500/20 border border-gold-500/40 text-gold-300 text-sm font-bold hover:bg-gold-500/30 transition-colors"><i class="fas fa-clock mr-1.5"></i>Postpone</button>`;
      } else if (s === 'approved') {
        if (canCancel || isAdm) btns += `<button onclick="closeModal('apptDetailModal');confirmAndHandleAppt(${jsArg(a.id)},${jsArg('cancelled')},${jsArg(a.patient_email)})" class="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-bold hover:bg-red-500/30 transition-colors"><i class="fas fa-times mr-1.5"></i>Cancel</button>`;
      }

      btns += `<button onclick="closeModal('apptDetailModal');loadInlineDocChat(${jsArg(a.id)},${jsArg(a.patient_name)},${jsArg(a.patient_email)});document.getElementById('iDocChatPatientTabs')?.scrollIntoView({behavior:'smooth',block:'nearest'})" class="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"><i class="fas fa-comment mr-1.5"></i>Chat</button>`;

      if (!btns.includes('Approve') && !btns.includes('Cancel') && !btns.includes('Postpone')) {
        btns = `<button onclick="closeModal('apptDetailModal')" class="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium"><i class="fas fa-times mr-1.5"></i>Close</button>` + btns;
      }

      actionsEl.innerHTML = btns;
    }

    openModal('apptDetailModal');
  };


