/* =====================================================================
 * admin.js — Admin dashboards
 * كود الأدمن: إدارة الحجوزات والأطباء والمرضى والتحليلات.
 * NOTE: loaded as a classic <script defer> AFTER page.js — shares the
 * same global scope (helpers like escapeHtml/showToast/sbClient/currentUser
 * are defined in page.js).
 * ===================================================================== */

/* ========== INLINE ADMIN DASHBOARD — tabs / stats / appts / doctors / add doctor ========== */

  // ===========================
  // INLINE ADMIN DASHBOARD LOGIC
  // ===========================
  let _iAdminDoctorFilter = '';
  window.iAdminSwitchTab = function(tab) {
    const tabs = ['appointments','doctors','patients','analytics','addDoctor'];
    tabs.forEach(name => {
      const pane = document.getElementById('iAdminPane-' + name);
      const btn  = document.getElementById('iAdminTab-' + name);
      if (!pane || !btn) return;
      if (name === tab) {
        pane.classList.remove('hidden'); pane.classList.add('block');
        btn.classList.add('bg-red-600','text-white'); btn.classList.remove('text-slate-400');
      } else {
        pane.classList.add('hidden'); pane.classList.remove('block');
        btn.classList.remove('bg-red-600','text-white'); btn.classList.add('text-slate-400');
      }
    });
    if (tab === 'doctors')      loadInlineAdminDoctors();
    if (tab === 'appointments') loadInlineAdminAppts();
    if (tab === 'analytics')    loadInlineAdminAnalytics();
    if (tab === 'patients')     loadInlineAdminPatients();
  };

  window.iAdminSetDoctorFilter = function(doctorName) {
    _iAdminDoctorFilter = doctorName;
    document.querySelectorAll('.i-admin-doc-tab').forEach(btn => {
      const active = doctorName==='' ? btn.textContent.trim()==='All Doctors' : (btn.getAttribute('onclick')||'').includes(`'${doctorName}'`);
      if(active){btn.classList.add('bg-red-600','text-white');btn.classList.remove('bg-white/5','text-slate-400','hover:bg-white/10');}
      else{btn.classList.remove('bg-red-600','text-white');btn.classList.add('bg-white/5','text-slate-400','hover:bg-white/10');}
    });
    loadInlineAdminAppts();
  };

  async function loadInlineAdminStats() {
    try {
      const today = new Date().toISOString().slice(0,10);
      const now = new Date();
      const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartStr = weekStart.toISOString();
      const [rAll,rPend,rAppr,rCanc,rPost,rToday,rWeek,rRevenue] = await Promise.all([
        sbClient.from('appointments').select('*',{count:'exact',head:true}),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','pending'),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','approved'),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','cancelled'),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','postponed'),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('preferred_date',today),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).gte('preferred_date',weekStartStr),
        sbClient.from('appointments').select('payment_method').eq('status','approved'),
      ]);
      const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??0;};
      s('iAdminStatTotal',rAll.count??0);
      s('iAdminStatPending',rPend.count??0);
      s('iAdminStatApproved',rAppr.count??0);
      s('iAdminStatCancelled',rCanc.count??0);
      s('iAdminStatPostponed',rPost.count??0);
      s('iAdminStatToday',rToday.count??0);
      s('iAdminStatWeek',rWeek.count??0);
      const rev = (rRevenue?.data||[]).length * 10;
      const revEl = document.getElementById('iAdminStatRevenue');
      if (revEl) revEl.textContent = '$' + rev;
      // Sync modal stats too
      s('adminStatTotal',rAll.count??0); s('adminStatPending',rPend.count??0);
      s('adminStatApproved',rAppr.count??0); s('adminStatToday',rToday.count??0);
    } catch(err){ console.error(err); }
  }

  window.loadInlineAdminAppts = async function() {
    const container = document.getElementById('iAdminApptsList');
    const statusFilter = document.getElementById('iAdminStatusFilter')?.value||'';
    if (!container) return;
    // Rebuild doctor filter tabs
    const tabsEl = document.getElementById('iAdminDoctorTabs');
    if (tabsEl && _doctorProfilesCache.length) {
      const activeDocs = _doctorProfilesCache.filter(d=>d.is_active&&!d.permissions?.is_admin);
      tabsEl.innerHTML = '<button onclick="iAdminSetDoctorFilter(\'\')" class="i-admin-doc-tab px-3 py-1 rounded-full text-xs font-medium '+(_iAdminDoctorFilter===''?'bg-red-600 text-white':'bg-white/5 text-slate-400 hover:bg-white/10')+' transition-all">All Doctors</button>'
        +activeDocs.map(d=>`<button onclick="iAdminSetDoctorFilter(${jsArg(d.display_name)})" class="i-admin-doc-tab px-3 py-1 rounded-full text-xs font-medium ${_iAdminDoctorFilter===d.display_name?'bg-red-600 text-white':'bg-white/5 text-slate-400 hover:bg-white/10'} transition-all">${escapeHtml(d.display_name)}</button>`).join('');
    }
    container.innerHTML = '<div class="flex items-center justify-center py-8 gap-2 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading...</span></div>';
    try {
      let q = sbClient.from('appointments').select('*').order('created_at',{ascending:false}).limit(60);
      if (statusFilter) q=q.eq('status',statusFilter);
      if (_iAdminDoctorFilter) q=q.eq('doctor_name',_iAdminDoctorFilter);
      const {data,error} = await q; if(error) throw error;
      const countEl = document.getElementById('iAdminApptCount');
      if(countEl) countEl.textContent = data?.length ? `${data.length} record${data.length>1?'s':''}` : '';
      if (!data||data.length===0) {
        container.innerHTML = '<div class="text-center py-8"><i class="fas fa-calendar-times text-slate-600 text-3xl mb-3 block"></i><p class="text-sm text-slate-500">No appointments found.</p></div>';
        return;
      }
      const sCls={pending:'bg-gold-500/15 border-gold-500/30 text-gold-300',approved:'bg-green-500/15 border-green-500/30 text-green-300',postponed:'bg-blue-500/15 border-blue-500/30 text-blue-300',cancelled:'bg-red-500/15 border-red-500/30 text-red-300'};
      const sIcon={pending:'fa-clock',approved:'fa-check-circle',postponed:'fa-redo',cancelled:'fa-times-circle'};
      const pmLabels={card:'Visa/MC',mir:'Mir',apple:'Apple Pay',cash:'Cash'};
      const pmColors={card:'text-blue-400',mir:'text-green-400',apple:'text-slate-300',cash:'text-green-300'};
      container.innerHTML = data.map(a => {
        const s=safeStatus(a.status);
        const badge=`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${sCls[s]||sCls.pending}"><i class="fas ${sIcon[s]||'fa-circle'} text-[8px]"></i>${capitalize(s)}</span>`;
        const dt=a.preferred_date?new Date(a.preferred_date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):'TBD';
        const cr=new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'});
        const pm=safePaymentMethod(a.payment_method);
        const pmBadge=`<span class="text-[10px] ${pmColors[pm]||'text-slate-400'} flex items-center gap-0.5"><i class="fas fa-${pm==='cash'?'money-bill-wave':'credit-card'} text-[8px]"></i>${pmLabels[pm]||'Card'}</span>`;
        let actionBtns='';
        if(s==='pending'){actionBtns=`<button onclick="iAdminHandleAppt(${jsArg(a.id)},${jsArg('approved')},${jsArg(a.patient_email)},this)" class="w-full px-2.5 py-1.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-[11px] font-semibold hover:bg-green-500/25 transition-colors"><i class="fas fa-check mr-1"></i>Accept</button><button onclick="iAdminHandleAppt(${jsArg(a.id)},${jsArg('cancelled')},${jsArg(a.patient_email)},this)" class="w-full px-2.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-semibold hover:bg-red-500/25 transition-colors"><i class="fas fa-times mr-1"></i>Cancel</button>`;}
        else if(s==='approved'){actionBtns=`<button onclick="iAdminHandleAppt(${jsArg(a.id)},${jsArg('cancelled')},${jsArg(a.patient_email)},this)" class="w-full px-2.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-semibold hover:bg-red-500/25 transition-colors"><i class="fas fa-times mr-1"></i>Cancel</button>`;}
        const payBtn=s==='approved'?`<button onclick="payForAppointment(${jsArg(a.id)},${jsArg(a.patient_email)},${jsArg(a.patient_name)},this,${jsArg(pm)})" class="w-full px-2.5 py-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-300 text-[11px] font-semibold hover:bg-brand-500/25 transition-colors"><i class="fas fa-${pm==='cash'?'money-bill-wave':'credit-card'} mr-1"></i>${pm==='cash'?'Cash':'Pay $10'}</button>`:'';
        return `<div class="glass border border-white/8 rounded-2xl p-3.5 mb-2" id="i-admin-appt-${escapeHtml(a.id)}">
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-1.5 mb-1"><span class="text-sm font-bold text-white">${escapeHtml(a.patient_name)}</span>${badge}${pmBadge}</div>
              <div class="text-[11px] text-slate-500 space-y-0.5">
                <div><i class="fas fa-user-md mr-1 text-brand-400/60"></i>${escapeHtml(a.doctor_name||'TBD')} &nbsp;&middot;&nbsp; <i class="fas fa-stethoscope mr-1 text-brand-400/60"></i>${escapeHtml(a.specialty||'—')}</div>
                <div><i class="fas fa-calendar mr-1 text-brand-400/60"></i>${escapeHtml(dt)} &nbsp;&middot;&nbsp; Booked ${escapeHtml(cr)}</div>
                ${a.patient_email?`<div><i class="fas fa-envelope mr-1 text-brand-400/60"></i>${escapeHtml(a.patient_email)}</div>`:''}
              </div>
              ${a.notes?`<div class="mt-1.5 text-[11px] text-slate-500 bg-white/3 rounded-lg px-2 py-1 line-clamp-2 border border-white/5">${escapeHtml(a.notes)}</div>`:''}
            </div>
            <div class="flex flex-col gap-1.5 flex-shrink-0 min-w-[90px]">
              ${actionBtns}${payBtn}
              <button onclick="openAdminChat(${jsArg(a.id)},${jsArg(a.patient_name)},${jsArg(a.patient_email)},${jsArg(a.phone)},${jsArg(a.specialty)},${jsArg(dt)})" class="w-full px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[11px] font-medium hover:text-white hover:bg-white/10 transition-colors"><i class="fas fa-comment mr-1"></i>Chat</button>
              <button onclick="adminEditAppt(${jsArg(JSON.stringify(a))})" class="w-full px-2.5 py-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-300 text-[11px] font-medium hover:bg-brand-500/25 transition-colors"><i class="fas fa-pen mr-1"></i>Edit</button>
              <button onclick="adminDeleteAppt(${jsArg(a.id)},${jsArg(a.patient_name)})" class="w-full px-2.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-medium hover:bg-red-500/25 transition-colors"><i class="fas fa-trash mr-1"></i>Delete</button>
            </div>
          </div>
        </div>`;
      }).join('');
    } catch(err) { container.innerHTML = `<p class="text-sm text-red-400 text-center py-6">${escapeHtml(err.message)}</p>`; }
  };

  window.iAdminHandleAppt = async function(appointmentId, action, patientEmail, btn) {
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
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
      await loadInlineAdminStats(); await loadInlineAdminAppts();
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = orig;
      showToast('Action failed: ' + err.message, 'error');
    }
  };

  window.loadInlineAdminDoctors = async function() {
    const container = document.getElementById('iAdminDoctorsList');
    if (!container) return;
    container.innerHTML = '<div class="flex items-center justify-center py-6 gap-2 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading...</span></div>';
    try {
      const {data,error} = await sbClient.from('doctor_profiles').select('*').order('created_at',{ascending:true});
      if(error) throw error;
      if(!data||data.length===0){container.innerHTML='<p class="text-sm text-slate-500 text-center py-6">No doctors assigned yet.</p>';return;}
      container.innerHTML = data.map(d=>{
        const perms=d.permissions||{};
        return `<div class="glass border border-white/8 rounded-xl p-3 mb-2 flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2"><span class="text-sm font-semibold text-white">${escapeHtml(d.display_name)}</span>
              ${perms.is_admin?'<span class="text-[10px] bg-red-500/20 border border-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full">Admin</span>':'<span class="text-[10px] bg-blue-500/20 border border-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full">Doctor</span>'}
              ${d.is_active?'<span class="text-[10px] bg-green-500/20 border border-green-500/30 text-green-300 px-1.5 py-0.5 rounded-full">Active</span>':'<span class="text-[10px] bg-slate-500/20 border border-slate-500/30 text-slate-400 px-1.5 py-0.5 rounded-full">Inactive</span>'}
            </div>
            <div class="text-xs text-slate-500 mt-0.5">${escapeHtml(d.email)} &middot; ${escapeHtml(d.specialty||'General')}</div>
          </div>
          <button onclick="iAdminToggleActive(${jsArg(d.id)},${Boolean(d.is_active)})" class="px-2.5 py-1 rounded-lg ${d.is_active?'bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20':'bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20'} text-[10px] font-medium transition-colors">${d.is_active?'Deactivate':'Activate'}</button>
          <button onclick="adminEditDoctor(${jsArg(d.id)})" class="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-300 hover:bg-brand-500/20 text-[10px] font-medium transition-colors"><i class="fas fa-pen mr-1"></i>Edit</button>
          <button onclick="adminDeleteDoctor(${jsArg(d.id)},${jsArg(d.display_name)})" class="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-[10px] font-medium transition-colors"><i class="fas fa-trash mr-1"></i>Delete</button>
        </div>`;
      }).join('');
    } catch(err){container.innerHTML=`<p class="text-sm text-red-400 text-center py-4">${escapeHtml(err.message)}</p>`;}
  };

  window.iAdminToggleActive = async function(id, current) {
    try {
      const {error} = await sbClient.from('doctor_profiles').update({is_active:!current}).eq('id',id);
      if(error) throw error;
      showToast(`Doctor ${!current?'activated':'deactivated'}.`,'success');
      await loadDoctorProfiles(); loadInlineAdminDoctors();
    } catch(err){showToast('Error: '+err.message,'error');}
  };

  window.iAdminAddDoctor = async function(e) {
    e.preventDefault();
    const email=document.getElementById('iNewDocEmail').value.trim();
    const name=document.getElementById('iNewDocName').value.trim();
    const spec=document.getElementById('iNewDocSpec').value.trim()||'General';
    const bio=document.getElementById('iNewDocBio')?.value.trim()||null;
    const password=document.getElementById('iNewDocPassword')?.value||'';
    const photoFile=document.getElementById('iNewDocPhoto')?.files?.[0]||null;
    const viewOwn=document.getElementById('iNewDocViewOwn').checked;
    const canApprove=document.getElementById('iNewDocCanApprove').checked;
    const canCancel=document.getElementById('iNewDocCanCancel').checked;
    if (!password || password.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return; }
    const btn=e.submitter; const orig=btn.innerHTML;
    btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      let photo_url = null;
      let photoFailed = false;
      if (photoFile) {
        btn.innerHTML='<i class="fas fa-cloud-upload-alt fa-spin"></i> Uploading photo...';
        try {
          photo_url = await uploadDoctorPhoto(photoFile, email);
        } catch (upErr) {
          // Photo upload failure must NOT block saving the doctor
          console.error('Doctor photo upload failed:', upErr);
          photoFailed = true;
        }
      }
      const payload = {email,display_name:name,specialty:spec,bio,is_active:true,doctor_password:password,permissions:{view_own_only:viewOwn,can_approve:canApprove,can_cancel:canCancel,is_admin:false}};
      if (photo_url) payload.photo_url = photo_url;
      const {error}=await sbClient.from('doctor_profiles').upsert(payload,{onConflict:'email'});
      if(error) throw error;
      showToast(photoFailed ? 'Doctor saved, but photo upload failed — check the "doctor-photos" storage bucket.' : 'Doctor saved!', photoFailed ? 'info' : 'success');
      e.target.reset();
      document.getElementById('iNewDocViewOwn').checked=true;
      document.getElementById('iNewDocCanApprove').checked=true;
      document.getElementById('iNewDocCanCancel').checked=true;
      const pd=document.getElementById('iNewDocPassword'); if(pd) pd.value='';
      const prev=document.getElementById('iNewDocPhotoPreview');
      if(prev) prev.innerHTML='<i class="fas fa-user-md text-slate-600 text-xl" id="iNewDocPhotoIcon"></i>';
      const pn=document.getElementById('iNewDocPhotoName'); if(pn) pn.textContent='No file selected';
      await loadDoctorProfiles(); loadInlineAdminDoctors();
    } catch(err){showToast('Error: '+err.message,'error');}
    finally{btn.disabled=false; btn.innerHTML=orig;}
  };


/* ========== ADMIN — PATIENT MANAGEMENT + ANALYTICS ========== */

  // ===========================
  // ADMIN PATIENT MANAGEMENT
  // ===========================
  window.loadInlineAdminPatients = async function(searchQuery = '') {
    const container  = document.getElementById('iAdminPatientsList');
    const countEl    = document.getElementById('iAdminPatientCount');
    if (!container) return;
    container.innerHTML = '<div class="flex items-center justify-center py-8 gap-2 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading patients...</span></div>';
    try {
      const { data, error } = await sbClient
        .from('appointments')
        .select('patient_name,patient_email,patient_age,patient_gender,phone,specialty,status,created_at,doctor_name,notes,id')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      if (!data || !data.length) {
        container.innerHTML = '<div class="text-center py-10 text-slate-500 text-sm"><i class="fas fa-users text-3xl block mb-3 text-slate-600"></i>No patients yet</div>';
        return;
      }

      // Group by email (or name if no email)
      const map = {};
      data.forEach(a => {
        const key = (a.patient_email || a.patient_name || 'unknown').toLowerCase().trim();
        if (!map[key]) {
          map[key] = { name: a.patient_name, email: a.patient_email, phone: a.phone, age: a.patient_age, gender: a.patient_gender, appts: [] };
        }
        // Keep freshest phone/age/gender
        if (a.phone && !map[key].phone) map[key].phone = a.phone;
        if (a.patient_age && !map[key].age) map[key].age = a.patient_age;
        if (a.patient_gender && !map[key].gender) map[key].gender = a.patient_gender;
        map[key].appts.push(a);
      });

      let patients = Object.values(map).sort((a,b) => b.appts.length - a.appts.length);

      // Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        patients = patients.filter(p =>
          (p.name||'').toLowerCase().includes(q) ||
          (p.email||'').toLowerCase().includes(q) ||
          (p.phone||'').toLowerCase().includes(q)
        );
      }

      if (countEl) countEl.textContent = `${patients.length} patient${patients.length !== 1 ? 's' : ''}`;

      if (!patients.length) {
        container.innerHTML = '<div class="text-center py-8 text-slate-500 text-sm">No patients found</div>';
        return;
      }

      const sCls = {pending:'bg-gold-500/15 border-gold-500/30 text-gold-300', approved:'bg-green-500/15 border-green-500/30 text-green-300', postponed:'bg-blue-500/15 border-blue-500/30 text-blue-300', cancelled:'bg-red-500/15 border-red-500/30 text-red-300'};

      container.innerHTML = patients.map(p => {
        const initial   = (p.name || '?').charAt(0).toUpperCase();
        const total     = p.appts.length;
        const approved  = p.appts.filter(a => a.status === 'approved').length;
        const pending   = p.appts.filter(a => a.status === 'pending').length;
        const cancelled = p.appts.filter(a => a.status === 'cancelled').length;
        const lastAppt  = p.appts[0];
        const lastSpec  = capitalize(lastAppt?.specialty || '');
        const lastDate  = lastAppt?.created_at ? new Date(lastAppt.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';
        const pData     = jsArg(JSON.stringify(p));

        return `<div class="glass border border-white/8 rounded-2xl overflow-hidden mb-2 hover:border-brand-500/20 transition-all group cursor-pointer" onclick="openPatientDetail(${pData})">
          <div class="p-4">
            <div class="flex items-start gap-3">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">${escapeHtml(initial)}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-extrabold text-white mb-1">${escapeHtml(p.name || 'Unknown')}</div>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  ${p.email ? `<span><i class="fas fa-envelope mr-1 text-brand-400/60 text-[10px]"></i>${escapeHtml(p.email)}</span>` : ''}
                  ${p.phone ? `<span><i class="fas fa-phone mr-1 text-brand-400/60 text-[10px]"></i>${escapeHtml(p.phone)}</span>` : ''}
                  ${p.age   ? `<span><i class="fas fa-user mr-1 text-slate-600 text-[10px]"></i>${p.age} yrs · ${capitalize(p.gender||'—')}</span>` : ''}
                </div>
                ${lastSpec ? `<div class="text-[11px] text-slate-600 mt-1"><i class="fas fa-stethoscope mr-1"></i>Last: ${escapeHtml(lastSpec)} · ${escapeHtml(lastDate)}</div>` : ''}
              </div>
              <!-- Quick stats -->
              <div class="flex flex-col items-end gap-1 flex-shrink-0">
                <span class="text-lg font-extrabold text-white">${total}</span>
                <span class="text-[10px] text-slate-500">appts</span>
              </div>
            </div>
            <!-- Status pills -->
            <div class="flex flex-wrap gap-1.5 mt-3">
              ${approved  ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-green-500/15 border-green-500/30 text-green-300"><i class="fas fa-check text-[8px]"></i>${approved} Approved</span>` : ''}
              ${pending   ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-gold-500/15 border-gold-500/30 text-gold-300"><i class="fas fa-clock text-[8px]"></i>${pending} Pending</span>` : ''}
              ${cancelled ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-red-500/15 border-red-500/30 text-red-300"><i class="fas fa-times text-[8px]"></i>${cancelled} Cancelled</span>` : ''}
            </div>
          </div>
          <!-- Actions bar -->
          <div class="flex items-center gap-2 px-4 py-2.5 border-t border-white/5 bg-dark-900/20">
            <button onclick="event.stopPropagation();openPatientDetail(${pData})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold hover:bg-brand-500/20 transition-colors">
              <i class="fas fa-eye text-[10px]"></i>View Details
            </button>
            <button onclick="event.stopPropagation();adminDeletePatient(${jsArg(p.email||p.name)},${jsArg(p.name)})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/20 transition-colors ml-auto">
              <i class="fas fa-trash text-[10px]"></i>Delete
            </button>
          </div>
        </div>`;
      }).join('');
    } catch(err) {
      container.innerHTML = `<div class="text-center py-4 text-red-400 text-sm">${escapeHtml(err.message)}</div>`;
    }
  };

  // Keep old search function as alias
  window.iAdminSearchPatients = (q) => loadInlineAdminPatients(q);

  // Open patient detail modal
  window.openPatientDetail = function(patientJson) {
    const p = typeof patientJson === 'string' ? JSON.parse(patientJson) : patientJson;
    const initial = (p.name || '?').charAt(0).toUpperCase();

    // Header
    const avatarEl = document.getElementById('pdAvatar'); if (avatarEl) avatarEl.textContent = initial;
    const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val || '—'; };
    setEl('pdName',  p.name);
    setEl('pdEmail', p.email);
    setEl('pdPhone', p.phone);
    const metaEl = document.getElementById('pdMeta');
    if (metaEl) metaEl.textContent = [p.age ? p.age + ' yrs' : '', capitalize(p.gender||'')].filter(Boolean).join(' · ') || '—';

    // Stats
    const appts    = p.appts || [];
    const approved  = appts.filter(a => a.status === 'approved').length;
    const pending   = appts.filter(a => a.status === 'pending').length;
    const cancelled = appts.filter(a => a.status === 'cancelled').length;
    setEl('pdStatTotal',     appts.length);
    setEl('pdStatApproved',  approved);
    setEl('pdStatPending',   pending);
    setEl('pdStatCancelled', cancelled);

    // Appointments list
    const listEl = document.getElementById('pdAppointmentsList');
    if (listEl) {
      if (!appts.length) {
        listEl.innerHTML = '<div class="text-center py-6 text-slate-500 text-sm">No appointments</div>';
      } else {
        const sCls = {pending:'bg-gold-500/15 border-gold-500/30 text-gold-300', approved:'bg-green-500/15 border-green-500/30 text-green-300', postponed:'bg-blue-500/15 border-blue-500/30 text-blue-300', cancelled:'bg-red-500/15 border-red-500/30 text-red-300', completed:'bg-purple-500/15 border-purple-500/30 text-purple-300'};
        const sIcon = {pending:'fa-clock', approved:'fa-check-circle', postponed:'fa-redo', cancelled:'fa-times-circle', completed:'fa-star'};
        listEl.innerHTML = appts.map(a => {
          const s    = safeStatus(a.status);
          const dt   = a.preferred_date ? new Date(a.preferred_date + 'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) : 'No date';
          const cr   = new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
          const badge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${sCls[s]||sCls.pending}"><i class="fas ${sIcon[s]||'fa-circle'} text-[8px]"></i>${capitalize(s)}</span>`;
          return `<div class="glass border border-white/8 rounded-xl p-3 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i class="fas fa-stethoscope text-brand-400 text-xs"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="text-sm font-bold text-white capitalize">${escapeHtml(a.specialty||'—')}</span>${badge}
              </div>
              <div class="text-xs text-slate-500 space-y-0.5">
                <div><i class="fas fa-user-md mr-1 text-brand-400/60"></i>${escapeHtml(a.doctor_name||'TBD')}</div>
                <div><i class="fas fa-calendar mr-1 text-brand-400/60"></i>${escapeHtml(dt)} · Booked ${escapeHtml(cr)}</div>
                ${a.notes ? `<div class="text-slate-400 mt-1 line-clamp-1"><i class="fas fa-comment-medical mr-1 text-brand-400/50"></i>${escapeHtml(a.notes)}</div>` : ''}
              </div>
            </div>
          </div>`;
        }).join('');
      }
    }

    // Delete button
    const deleteBtn = document.getElementById('pdDeleteBtn');
    if (deleteBtn) {
      deleteBtn.onclick = () => adminDeletePatient(p.email || p.name, p.name);
    }

    openModal('patientDetailModal');
  };

  // Delete patient (all appointments)
  window.adminDeletePatient = function(emailOrName, displayName) {
    document.getElementById('confirmTitle').textContent = 'Delete Patient';
    document.getElementById('confirmMsg').textContent = `Delete all data for "${displayName}"? This will permanently remove all their appointments and cannot be undone.`;
    const iconEl = document.getElementById('confirmIcon');
    iconEl.className = 'w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-500/20';
    document.getElementById('confirmIconEl').className = 'fas fa-user-slash text-red-400 text-2xl';
    const btn = document.getElementById('confirmProceedBtn');
    btn.className = 'flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors';
    btn.onclick = async function() {
      closeModal('confirmActionModal');
      closeModal('patientDetailModal');
      try {
        // Delete by email if available, else by name
        const isEmail = emailOrName && emailOrName.includes('@');
        const { error } = isEmail
          ? await sbClient.from('appointments').delete().eq('patient_email', emailOrName)
          : await sbClient.from('appointments').delete().eq('patient_name', emailOrName);
        if (error) throw error;
        showToast(`Patient "${displayName}" deleted successfully.`, 'success');
        loadInlineAdminPatients(document.getElementById('iAdminPatientSearch')?.value || '');
        loadInlineAdminStats();
      } catch(err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    };
    openModal('confirmActionModal');
  };

  // Admin inline analytics
  async function loadInlineAdminAnalytics() {
    try {
      const {data} = await sbClient.from('appointments').select('status,payment_method').limit(500);
      if (!data||!data.length) return;
      const counts={pending:0,approved:0,postponed:0,cancelled:0};
      const rev={card:0,cash:0,apple:0};
      data.forEach(a=>{
        if(counts[a.status]!==undefined) counts[a.status]++;
        const pm=safePaymentMethod(a.payment_method);
        if(a.status==='approved'&&rev[pm]!==undefined) rev[pm]++;
      });
      const total=counts.pending+counts.approved+counts.postponed+counts.cancelled||1;
      const setBar=(id,labelId,count)=>{
        const pct=Math.round((count/total)*100);
        const el=document.getElementById(id); if(el) el.style.width=pct+'%';
        const lbl=document.getElementById(labelId); if(lbl) lbl.textContent=count;
      };
      setBar('iAchartPending','iAchartPendingLabel',counts.pending);
      setBar('iAchartApproved','iAchartApprovedLabel',counts.approved);
      setBar('iAchartPostponed','iAchartPostponedLabel',counts.postponed);
      setBar('iAchartCancelled','iAchartCancelledLabel',counts.cancelled);
      const revTotal=rev.card+rev.cash+rev.apple||1;
      const setRev=(id,labelId,count)=>{
        const pct=Math.round((count/revTotal)*100);
        const el=document.getElementById(id); if(el) el.style.width=pct+'%';
        const lbl=document.getElementById(labelId); if(lbl) lbl.textContent='$'+(count*10);
      };
      setRev('iArevCard','iArevCardLabel',rev.card);
      setRev('iArevCash','iArevCashLabel',rev.cash);
      setRev('iArevApple','iArevAppleLabel',rev.apple);
      // Activity log
      const logEl = document.getElementById('iAadminActivityLog');
      if (logEl) {
        const {data:acts} = await sbClient.from('appointments').select('patient_name,status,doctor_name,created_at').order('created_at',{ascending:false}).limit(15);
        if (acts&&acts.length) {
          const icons={pending:'fa-clock text-gold-400',approved:'fa-check-circle text-green-400',postponed:'fa-redo text-blue-400',cancelled:'fa-times-circle text-red-400'};
          logEl.innerHTML = acts.map(a=>{
            const s=safeStatus(a.status);
            const time=new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
            return `<div class="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0"><i class="fas ${icons[s]||'fa-circle'} text-[10px] w-4"></i><span class="text-slate-300">${escapeHtml(a.patient_name||'Unknown')}</span><span class="text-slate-500">— ${capitalize(s)}</span>${a.doctor_name?`<span class="text-slate-600">by ${escapeHtml(a.doctor_name)}</span>`:''}<span class="text-slate-600 ml-auto">${escapeHtml(time)}</span></div>`;
          }).join('');
        } else { logEl.innerHTML = '<div class="text-center py-4 text-slate-500">No activity yet</div>'; }
      }
    } catch(err){console.error(err);}
  }


/* ========== ADMIN — SEARCH HELPERS ========== */

  let _adminSearchQuery = '';
  let _adminDateFilter = 'all';
  let _adminDoctorSearch = '';

  window.adminSearchPatients = function(query) {
    _adminSearchQuery = query.trim().toLowerCase();
    loadAdminAppts();
  };

  window.adminSearchDoctors = function(query) {
    _adminDoctorSearch = query.trim().toLowerCase();
    loadAdminDoctors();
  };

  window.adminSearchPatientsList = async function(query) {
    const q = query.trim().toLowerCase();
    const container = document.getElementById('adminPatientsList');
    if (!q) { container.innerHTML = '<div class="text-center py-8 text-slate-500 text-sm"><i class="fas fa-users text-2xl block mb-2 text-slate-600"></i>Search to find patients</div>'; return; }
    container.innerHTML = '<div class="text-center py-4 text-slate-400 text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>Searching...</div>';
    try {
      const { data } = await sbClient.from('appointments').select('patient_name, patient_email, patient_age, patient_gender, phone, specialty, status, created_at').order('created_at', { ascending: false }).limit(50);
      if (!data) { container.innerHTML = '<div class="text-center py-4 text-slate-500">No results</div>'; return; }
      const unique = {};
      data.forEach(a => { const key = (a.patient_email || a.patient_name || '').toLowerCase(); if (key.includes(q) && !unique[key]) unique[key] = a; });
      const patients = Object.values(unique);
      if (!patients.length) { container.innerHTML = '<div class="text-center py-4 text-slate-500">No patients found</div>'; return; }
      container.innerHTML = patients.map(p => {
        const initial = (p.patient_name || '?').charAt(0).toUpperCase();
        return `<div class="glass border border-white/8 rounded-xl p-3 flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">${initial}</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-white">${escapeHtml(p.patient_name||'Unknown')}</div>
            <div class="text-xs text-slate-500">${escapeHtml(p.patient_email||'—')} ${p.phone ? '· '+escapeHtml(p.phone) : ''}</div>
            <div class="text-[10px] text-slate-600 mt-0.5">${escapeHtml(p.patient_age||'—')} yrs · ${escapeHtml(p.patient_gender||'—')} · ${escapeHtml(p.specialty||'—')}</div>
          </div>
        </div>`;
      }).join('');
    } catch(err) { container.innerHTML = `<div class="text-center py-4 text-red-400 text-sm">${escapeHtml(err.message)}</div>`; }
  };


/* ========== ADMIN (modal) — TAB SWITCHING ========== */

  window.adminSwitchTab = function(tab) {
    ['appointments','doctors','patients','analytics','addDoctor'].forEach(t => {
      const pane = document.getElementById('adminPane-'+t);
      const btn  = document.getElementById('adminTab-'+t);
      if (!pane || !btn) return;
      if (t === tab) {
        pane.classList.remove('hidden'); pane.classList.add('flex');
        if (t === 'appointments') pane.classList.add('flex-col');
        btn.classList.add('bg-red-600','text-white'); btn.classList.remove('text-slate-400');
      } else {
        pane.classList.add('hidden'); pane.classList.remove('flex','flex-col');
        btn.classList.remove('bg-red-600','text-white'); btn.classList.add('text-slate-400');
      }
    });
    if (tab === 'doctors') loadAdminDoctors();
    if (tab === 'appointments') loadAdminAppts();
    if (tab === 'analytics') loadAdminAnalytics();
  };


/* ========== ADMIN (modal) DASHBOARD — chat / appts / stats / analytics / doctors ========== */

  let _adminDoctorFilter='';

  window.adminSetDoctorFilter=function(doctorName){
    _adminDoctorFilter=doctorName;
    document.querySelectorAll('.admin-doc-tab').forEach(btn=>{
      const active=doctorName===''?btn.textContent.trim()==='All Doctors':(btn.getAttribute('onclick')||'').includes(`'${doctorName}'`);
      if(active){btn.classList.add('bg-red-600','text-white');btn.classList.remove('bg-white/5','text-slate-400','hover:bg-white/10');}
      else{btn.classList.remove('bg-red-600','text-white');btn.classList.add('bg-white/5','text-slate-400','hover:bg-white/10');}
    });
    loadAdminAppts();
  };

  // Admin chat — persistent via Supabase
  window.openAdminChat = async function(apptId, patientName, patientEmail, phone, specialty, dateLabel) {
    document.getElementById('adminChatPatientName').textContent = patientName || 'Patient';
    document.getElementById('adminChatPatientEmail').textContent = patientEmail || '—';
    const emailLink = document.getElementById('adminChatEmailLink');
    emailLink.href = patientEmail ? `mailto:${encodeURIComponent(patientEmail)}?subject=${encodeURIComponent('Smart Clinic Pro - Appointment Update')}` : '#';
    const phoneEl = document.getElementById('adminChatPhone');
    if (phoneEl) phoneEl.innerHTML = `<i class="fas fa-phone text-brand-400/60 text-[9px]"></i><span>${escapeHtml(phone||'No phone')}</span>`;
    document.getElementById('adminChatApptInfo').textContent = `${specialty||''}${dateLabel?' · '+dateLabel:''}`;
    // Avatar initial
    const avatarEl = document.getElementById('adminChatAvatar');
    if (avatarEl) avatarEl.textContent = (patientName||'P').charAt(0).toUpperCase();
    const msgs = document.getElementById('adminChatMessages');
    msgs.dataset.apptId = apptId;

    // Show loading
    msgs.innerHTML = '<div class="flex items-center justify-center py-6 gap-2 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading messages...</span></div>';

    // Load from Supabase
    const chatMessages = await loadChatMessages(apptId);
    if (chatMessages.length) {
      msgs.innerHTML = _renderChatMessages(chatMessages, 'admin');
    } else {
      msgs.innerHTML = `<div class="text-center py-6 text-slate-500 text-sm"><i class="fas fa-comment-dots block text-3xl mb-2 text-brand-500/20"></i>No messages yet for this appointment</div>`;
    }
    msgs.scrollTop = msgs.scrollHeight;

    openModal('adminChatModal');
  };

  window.sendAdminChat = async function() {
    const input = document.getElementById('adminChatInput');
    const msg = input.value.trim();
    if (!msg) return;
    const msgs = document.getElementById('adminChatMessages');
    const apptId = msgs.dataset.apptId;
    const senderEmail = currentUser?.email || 'admin@smartclinicpro.com';
    const senderRole = isAdmin(currentUser?.email) ? 'admin' : 'doctor';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgs.innerHTML += `<div class="flex justify-end mt-2"><div class="msg-out px-4 py-2.5"><div class="text-sm leading-relaxed">${escapeHtml(msg)}</div><div class="flex items-center justify-end gap-1 mt-1.5"><span class="text-[10px] text-white/50">${time}</span><i class="fas fa-circle-notch fa-spin text-[9px] text-white/40 ml-0.5"></i></div></div></div>`;
    msgs.scrollTop = msgs.scrollHeight;
    input.value = '';

    const saved = await sendChatMessageToDB(apptId, senderEmail, senderRole, msg);
    const lastMsg = msgs.querySelector('.flex.justify-end:last-child .fa-circle-notch');
    if (lastMsg) lastMsg.className = saved ? 'fas fa-check text-[9px] text-slate-400' : 'fas fa-times text-[9px] text-red-400';
    if (!saved) {
      const err = document.createElement('div');
      err.className = 'text-center py-2 text-red-400 text-xs';
      err.textContent = 'Failed to save message';
      msgs.appendChild(err);
    }
  };

  function _getAdminDateRange(filter) {
    const now=new Date();
    const startOfDay=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    if(filter==='today') return {gte:startOfDay.toISOString()};
    if(filter==='week'){
      const ws=new Date(startOfDay); ws.setDate(ws.getDate()-ws.getDay());
      return {gte:ws.toISOString()};
    }
    if(filter==='month'){
      const ms=new Date(now.getFullYear(),now.getMonth(),1);
      return {gte:ms.toISOString()};
    }
    return null;
  }

  window.loadAdminAppts=async function(){
    const container=document.getElementById('adminApptsList');
    const statusFilter=document.getElementById('adminStatusFilter')?.value||'';
    const dateFilter=document.getElementById('adminDateFilter')?.value||'all';
    if(!container) return;
    const tabsEl=document.getElementById('adminDoctorTabs');
    if(tabsEl && _doctorProfilesCache.length) {
      const activeDocs=_doctorProfilesCache.filter(d=>d.is_active&&!d.permissions?.is_admin);
      tabsEl.innerHTML='<button onclick="adminSetDoctorFilter(\'\')" class="admin-doc-tab px-3 py-1 rounded-full text-xs font-medium '+(_adminDoctorFilter===''?'bg-red-600 text-white':'bg-white/5 text-slate-400 hover:bg-white/10')+' transition-all">All Doctors</button>'
        +activeDocs.map(d=>`<button onclick="adminSetDoctorFilter(${jsArg(d.display_name)})" class="admin-doc-tab px-3 py-1 rounded-full text-xs font-medium ${_adminDoctorFilter===d.display_name?'bg-red-600 text-white':'bg-white/5 text-slate-400 hover:bg-white/10'} transition-all">${escapeHtml(d.display_name)}</button>`).join('');
    }
    container.innerHTML='<div class="flex items-center justify-center py-8 gap-3 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading...</span></div>';
    try{
      let q=sbClient.from('appointments').select('*').order('created_at',{ascending:false}).limit(80);
      if(statusFilter) q=q.eq('status',statusFilter);
      if(_adminDoctorFilter) q=q.eq('doctor_name',_adminDoctorFilter);
      const dRange=_getAdminDateRange(dateFilter);
      if(dRange) q=q.gte('preferred_date',dRange.gte);
      const {data,error}=await q; if(error) throw error;
      let filtered=data||[];
      if(_adminSearchQuery) filtered=filtered.filter(a=>(a.patient_name||'').toLowerCase().includes(_adminSearchQuery));
      const countEl=document.getElementById('adminApptCount');
      if(countEl) countEl.textContent=filtered.length?`${filtered.length} record${filtered.length>1?'s':''}`:'';
      if(!filtered.length){
        container.innerHTML='<div class="text-center py-10"><i class="fas fa-calendar-times text-slate-600 text-3xl mb-3 block"></i><p class="text-sm text-slate-500">No appointments found for this filter.</p></div>';
        return;
      }
      const sCls={pending:'bg-gold-500/15 border-gold-500/30 text-gold-300',approved:'bg-green-500/15 border-green-500/30 text-green-300',postponed:'bg-blue-500/15 border-blue-500/30 text-blue-300',cancelled:'bg-red-500/15 border-red-500/30 text-red-300',completed:'bg-purple-500/15 border-purple-500/30 text-purple-300'};
      const sIcon={pending:'fa-clock',approved:'fa-check-circle',postponed:'fa-redo',cancelled:'fa-times-circle',completed:'fa-star'};
      const pmLabels={card:'Visa/MC',mir:'Mir',apple:'Apple Pay',cash:'Cash'};
      const pmColors={card:'text-blue-400',mir:'text-green-400',apple:'text-slate-300',cash:'text-green-300'};
      container.innerHTML=filtered.map(a=>{
        const s=safeStatus(a.status);
        const badge=`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${sCls[s]||sCls.pending}"><i class="fas ${sIcon[s]||'fa-circle'} text-[8px]"></i>${capitalize(s)}</span>`;
        const dt=a.preferred_date?new Date(a.preferred_date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):'TBD';
        const cr=new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'});
        const pm=safePaymentMethod(a.payment_method);
        const pmBadge=`<span class="text-[10px] ${pmColors[pm]||'text-slate-400'} flex items-center gap-0.5"><i class="fas fa-${pm==='cash'?'money-bill-wave':'credit-card'} text-[8px]"></i>${pmLabels[pm]||'Card'}</span>`;
        let actionBtns='';
        if(s==='pending'){actionBtns=`<button onclick="adminHandleAppt(${jsArg(a.id)},${jsArg('approved')},${jsArg(a.patient_email)},this)" class="px-2.5 py-1 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-[10px] font-medium hover:bg-green-500/25 transition-colors"><i class="fas fa-check mr-1"></i>Accept</button><button onclick="adminHandleAppt(${jsArg(a.id)},${jsArg('cancelled')},${jsArg(a.patient_email)},this)" class="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-medium hover:bg-red-500/25 transition-colors"><i class="fas fa-times mr-1"></i>Cancel</button>`;}
        else if(s==='approved'){actionBtns=`<button onclick="adminHandleAppt(${jsArg(a.id)},${jsArg('cancelled')},${jsArg(a.patient_email)},this)" class="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-medium hover:bg-red-500/25 transition-colors"><i class="fas fa-times mr-1"></i>Cancel</button>`;}
        const payBtn=s==='approved'?`<button onclick="payForAppointment(${jsArg(a.id)},${jsArg(a.patient_email)},${jsArg(a.patient_name)},this,${jsArg(pm)})" class="px-2.5 py-1 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-300 text-[10px] font-medium hover:bg-brand-500/25 transition-colors"><i class="fas fa-${pm==='cash'?'money-bill-wave':'credit-card'} mr-1"></i>${pm==='cash'?'Cash':'Pay $10'}</button>`:'';
        const initial=(a.patient_name||'P').charAt(0).toUpperCase();
        return `<div class="glass border border-white/8 rounded-xl p-3 mb-2" id="admin-appt-${escapeHtml(a.id)}"><div class="flex items-start gap-2"><div class="flex-1 min-w-0"><div class="flex flex-wrap items-center gap-1.5 mb-1"><span class="text-sm font-semibold text-white">${escapeHtml(a.patient_name)}</span>${badge}${pmBadge}</div><div class="text-[11px] text-slate-500 space-y-0.5"><div><i class="fas fa-user-md mr-1 text-brand-400/60"></i>${escapeHtml(a.doctor_name||'TBD')} &nbsp;&middot;&nbsp; <i class="fas fa-stethoscope mr-1 text-brand-400/60"></i>${escapeHtml(a.specialty||'—')}</div><div><i class="fas fa-calendar mr-1 text-brand-400/60"></i>${escapeHtml(dt)} &nbsp;&middot;&nbsp; Booked ${escapeHtml(cr)}</div>${a.patient_email?`<div><i class="fas fa-envelope mr-1 text-brand-400/60"></i>${escapeHtml(a.patient_email)}</div>`:''}</div>${a.notes?`<div class="mt-1.5 text-[11px] text-slate-500 bg-white/3 rounded-lg px-2 py-1 line-clamp-1 border border-white/5">${escapeHtml(a.notes)}</div>`:''}</div><div class="flex flex-col gap-1 flex-shrink-0">${actionBtns}${payBtn}<button onclick="openAdminChat(${jsArg(a.id)},${jsArg(a.patient_name)},${jsArg(a.patient_email)},${jsArg(a.phone)},${jsArg(a.specialty)},${jsArg(dt)})" class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[10px] font-medium hover:text-white hover:bg-white/10 transition-colors"><i class="fas fa-comment mr-1"></i>Chat</button><button onclick="adminEditAppt(${jsArg(JSON.stringify(a))})" class="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[10px] font-medium hover:bg-brand-500/20 transition-colors"><i class="fas fa-pen mr-1"></i>Edit</button><button onclick="adminDeleteAppt(${jsArg(a.id)},${jsArg(a.patient_name)})" class="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-medium hover:bg-red-500/20 transition-colors"><i class="fas fa-trash mr-1"></i>Delete</button></div></div></div>`;
      }).join('');
    }catch(err){container.innerHTML=`<p class="text-sm text-red-400 text-center py-6">${escapeHtml(err.message)}</p>`;}
  };

  window.adminHandleAppt=async function(appointmentId,action,patientEmail,btn){
    const orig=btn.innerHTML; btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>';
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
      await loadAdminStats(); await loadAdminAppts();
    } catch(err){
      btn.disabled=false; btn.innerHTML=orig;
      showToast('Action failed: ' + err.message, 'error');
    }
  };

  async function loadAdminStats(){
    try{
      const today=new Date().toISOString().slice(0,10);
      const now=new Date();
      const weekStart=new Date(now); weekStart.setDate(weekStart.getDate()-weekStart.getDay());
      const weekStartStr=weekStart.toISOString();
      const [rAll,rPend,rAppr,rCanc,rPost,rToday,rWeek,rRevenue]=await Promise.all([
        sbClient.from('appointments').select('*',{count:'exact',head:true}),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','pending'),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','approved'),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','cancelled'),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('status','postponed'),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).eq('preferred_date',today),
        sbClient.from('appointments').select('*',{count:'exact',head:true}).gte('preferred_date',weekStartStr),
        sbClient.from('appointments').select('payment_method').eq('status','approved'),
      ]);
      const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??0;};
      s('adminStatTotal',rAll.count??0); s('adminStatPending',rPend.count??0);
      s('adminStatApproved',rAppr.count??0); s('adminStatCancelled',rCanc.count??0);
      s('adminStatPostponed',rPost.count??0); s('adminStatToday',rToday.count??0);
      s('adminStatWeek',rWeek.count??0);
      // Calculate revenue ($10 per approved appointment)
      const rev=(rRevenue?.data||[]).length*10;
      const revEl=document.getElementById('adminStatRevenue');
      if(revEl) revEl.textContent='$'+rev;
    }catch(err){console.error(err);}
  }

  async function loadAdminAnalytics() {
    try {
      const {data} = await sbClient.from('appointments').select('status,payment_method').limit(500);
      if (!data||!data.length) return;
      const counts={pending:0,approved:0,postponed:0,cancelled:0};
      const rev={card:0,cash:0,apple:0,mir:0};
      data.forEach(a=>{
        if (counts[a.status]!==undefined) counts[a.status]++;
        const pm=safePaymentMethod(a.payment_method);
        if (a.status==='approved') { if (rev[pm]!==undefined) rev[pm]++; }
      });
      const total=counts.pending+counts.approved+counts.postponed+counts.cancelled||1;
      const setBar=(id,labelId,count)=>{
        const pct=Math.round((count/total)*100);
        const el=document.getElementById(id); if(el) el.style.width=pct+'%';
        const lbl=document.getElementById(labelId); if(lbl) lbl.textContent=count;
      };
      setBar('chartPending','chartPendingLabel',counts.pending);
      setBar('chartApproved','chartApprovedLabel',counts.approved);
      setBar('chartPostponed','chartPostponedLabel',counts.postponed);
      setBar('chartCancelled','chartCancelledLabel',counts.cancelled);
      // Revenue bars
      const revTotal=rev.card+rev.cash+rev.apple+rev.mir||1;
      const setRev=(id,labelId,count)=>{
        const pct=Math.round((count/revTotal)*100);
        const el=document.getElementById(id); if(el) el.style.width=pct+'%';
        const lbl=document.getElementById(labelId); if(lbl) lbl.textContent='$'+(count*10);
      };
      setRev('revCard','revCardLabel',rev.card);
      setRev('revCash','revCashLabel',rev.cash);
      setRev('revApple','revAppleLabel',rev.apple);
      setRev('revMir','revMirLabel',rev.mir);
      // Activity log
      loadAdminActivityLog();
    } catch(err){console.error(err);}
  }

  async function loadAdminActivityLog() {
    const container = document.getElementById('adminActivityLog');
    if (!container) return;
    try {
      const {data} = await sbClient.from('appointments').select('patient_name,status,doctor_name,updated_at,created_at').order('created_at',{ascending:false}).limit(20);
      if (!data||!data.length) { container.innerHTML='<div class="text-center py-4 text-slate-500 text-xs">No activity yet</div>'; return; }
      container.innerHTML = data.map(a=>{
        const time = new Date(a.created_at||a.updated_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
        const s = safeStatus(a.status);
        const icons = {pending:'fa-clock text-gold-400',approved:'fa-check-circle text-green-400',postponed:'fa-redo text-blue-400',cancelled:'fa-times-circle text-red-400'};
        return `<div class="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
          <i class="fas ${icons[s]||'fa-circle'} text-[10px] w-4"></i>
          <span class="text-slate-300">${escapeHtml(a.patient_name||'Unknown')}</span>
          <span class="text-slate-500">— ${capitalize(s)}</span>
          ${a.doctor_name?`<span class="text-slate-600">by ${escapeHtml(a.doctor_name)}</span>`:''}
          <span class="text-slate-600 ml-auto">${escapeHtml(time)}</span>
        </div>`;
      }).join('');
    } catch(err){ container.innerHTML='<div class="text-center py-4 text-slate-500 text-xs">Error loading activity</div>'; }
  }

  // loadAdminDoctors — populates Doctor Management tab
  window.loadAdminDoctors = async function() {
    const container = document.getElementById('adminDoctorsList');
    if (!container) return;
    container.innerHTML = '<div class="flex items-center justify-center py-6 gap-2 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading...</span></div>';
    try {
      const { data, error } = await sbClient.from('doctor_profiles').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-500 text-center py-6">No doctors assigned yet.</p>';
        return;
      }
      container.innerHTML = data.map(d => {
        const perms = d.permissions || {};
        return `<div class="glass border border-white/8 rounded-xl p-3 mb-2 flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2"><span class="text-sm font-semibold text-white">${escapeHtml(d.display_name)}</span>
              ${ perms.is_admin ? '<span class="text-[10px] bg-red-500/20 border border-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full">Admin</span>' : '<span class="text-[10px] bg-blue-500/20 border border-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full">Doctor</span>' }
              ${ d.is_active ? '<span class="text-[10px] bg-green-500/20 border border-green-500/30 text-green-300 px-1.5 py-0.5 rounded-full">Active</span>' : '<span class="text-[10px] bg-slate-500/20 border border-slate-500/30 text-slate-400 px-1.5 py-0.5 rounded-full">Inactive</span>' }
            </div>
            <div class="text-xs text-slate-500 mt-0.5"><i class="fas fa-envelope mr-1 text-brand-400/60"></i>${escapeHtml(d.email)} &nbsp;&middot;&nbsp; <i class="fas fa-stethoscope mr-1 text-brand-400/60"></i>${escapeHtml(d.specialty||'General')}</div>
            <div class="text-xs text-slate-600 mt-1 space-x-2">
              <span title="View own only"><i class="fas fa-${perms.view_own_only!==false?'lock text-gold-500':'unlock text-green-400'} text-[10px]"></i> ${perms.view_own_only!==false?'Own appts only':'All appts'}</span>
              <span><i class="fas fa-${perms.can_approve!==false?'check text-green-400':'times text-red-400'} text-[10px]"></i> ${perms.can_approve!==false?'Can approve':'No approve'}</span>
              <span><i class="fas fa-${perms.can_cancel!==false?'ban text-red-400':'minus text-slate-500'} text-[10px]"></i> ${perms.can_cancel!==false?'Can cancel':'No cancel'}</span>
            </div>
          </div>
          <button onclick="adminToggleActive(${jsArg(d.id)},${Boolean(d.is_active)})" class="px-2.5 py-1 rounded-lg ${d.is_active?'bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20':'bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20'} text-[10px] font-medium transition-colors">${d.is_active?'Deactivate':'Activate'}</button>
          <button onclick="adminEditDoctor(${jsArg(d.id)})" class="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-300 hover:bg-brand-500/20 text-[10px] font-medium transition-colors"><i class="fas fa-pen mr-1"></i>Edit</button>
          <button onclick="adminDeleteDoctor(${jsArg(d.id)},${jsArg(d.display_name)})" class="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-[10px] font-medium transition-colors"><i class="fas fa-trash mr-1"></i>Delete</button>
        </div>`;
      }).join('');
    } catch(err) { container.innerHTML = `<p class="text-sm text-red-400 text-center py-4">${escapeHtml(err.message)}</p>`; }
  };

  window.adminToggleActive = async function(id, current) {
    try {
      const { error } = await sbClient.from('doctor_profiles').update({ is_active: !current }).eq('id', id);
      if (error) throw error;
      showToast(`Doctor ${!current ? 'activated' : 'deactivated'}.`, 'success');
      await loadDoctorProfiles();
      loadAdminDoctors();
    } catch(err) { showToast('Error: '+err.message, 'error'); }
  };

  window.adminAddDoctor = async function(e) {
    e.preventDefault();
    const email    = document.getElementById('newDocEmail').value.trim();
    const name     = document.getElementById('newDocName').value.trim();
    const spec     = document.getElementById('newDocSpec').value.trim() || 'General';
    const bio      = document.getElementById('newDocBio')?.value.trim() || null;
    const password = document.getElementById('newDocPassword')?.value || '';
    const photoFile = document.getElementById('newDocPhoto')?.files?.[0] || null;
    const viewOwn    = document.getElementById('newDocViewOwn').checked;
    const canApprove = document.getElementById('newDocCanApprove').checked;
    const canCancel  = document.getElementById('newDocCanCancel').checked;
    if (!password || password.length < 4) { showToast('كلمة المرور لازم تكون 4 حروف على الأقل', 'error'); return; }
    const btn = e.submitter; const orig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      let photo_url = null;
      if (photoFile) {
        btn.innerHTML = '<i class="fas fa-cloud-upload-alt fa-spin"></i> Uploading photo...';
        photo_url = await uploadDoctorPhoto(photoFile, email);
      }
      const payload = { email, display_name: name, specialty: spec, bio, is_active: true,
        doctor_password: password,
        permissions: { view_own_only: viewOwn, can_approve: canApprove, can_cancel: canCancel, is_admin: false }
      };
      if (photo_url) payload.photo_url = photo_url;
      const { error } = await sbClient.from('doctor_profiles').upsert(payload, { onConflict: 'email' });
      if (error) throw error;
      showToast('Doctor saved!', 'success');
      e.target.reset();
      document.getElementById('newDocViewOwn').checked = true;
      document.getElementById('newDocCanApprove').checked = true;
      document.getElementById('newDocCanCancel').checked = true;
      const prev = document.getElementById('newDocPhotoPreview');
      if (prev) prev.innerHTML = '<i class="fas fa-user-md text-slate-600 text-xl" id="newDocPhotoIcon"></i>';
      const pn = document.getElementById('newDocPhotoName'); if (pn) pn.textContent = 'No file selected';
      await loadDoctorProfiles();
      loadAdminDoctors();
    } catch(err) { showToast('Error: '+err.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = orig; }
  };


/* ========== ADMIN — EDIT & DELETE DOCTOR ========== */

  // ===========================
  // ADMIN — EDIT DOCTOR
  // ===========================
  window.adminEditDoctor = async function(id) {
    try {
      const { data, error } = await sbClient.from('doctor_profiles').select('*').eq('id', id).single();
      if (error) throw error;
      document.getElementById('editDocId').value = data.id;
      document.getElementById('editDocName').value = data.display_name || '';
      document.getElementById('editDocEmail').value = data.email || '';
      document.getElementById('editDocSpec').value = data.specialty || '';
      document.getElementById('editDocBio').value = data.bio || '';
      document.getElementById('editDocViewOwn').checked = data.permissions?.view_own_only !== false;
      document.getElementById('editDocCanApprove').checked = data.permissions?.can_approve !== false;
      document.getElementById('editDocCanCancel').checked = data.permissions?.can_cancel !== false;
      document.getElementById('editDocIsActive').checked = data.is_active !== false;
      const preview = document.getElementById('editDocPhotoPreview');
      if (data.photo_url) {
        preview.innerHTML = `<img src="${escapeHtml(data.photo_url)}" class="w-full h-full object-cover" alt="Photo"/>`;
      } else {
        preview.innerHTML = '<i class="fas fa-user-md text-slate-600 text-xl" id="editDocPhotoIcon"></i>';
      }
      // Clear old file selection
      const fileInput = document.getElementById('editDocPhoto');
      if (fileInput) fileInput.value = '';
      openModal('editDoctorModal');
    } catch(err) {
      showToast('Error loading doctor: ' + err.message, 'error');
    }
  };

  window.adminSaveEditDoctor = async function(e) {
    e.preventDefault();
    const id       = document.getElementById('editDocId').value;
    const name     = document.getElementById('editDocName').value.trim();
    const spec     = document.getElementById('editDocSpec').value.trim();
    const bio      = document.getElementById('editDocBio').value.trim() || null;
    const newPass  = document.getElementById('editDocPassword')?.value || '';
    const photoFile  = document.getElementById('editDocPhoto')?.files?.[0] || null;
    const viewOwn    = document.getElementById('editDocViewOwn').checked;
    const canApprove = document.getElementById('editDocCanApprove').checked;
    const canCancel  = document.getElementById('editDocCanCancel').checked;
    const isActive   = document.getElementById('editDocIsActive').checked;
    const email      = document.getElementById('editDocEmail').value;
    if (newPass && newPass.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return; }
    const btn = document.getElementById('editDocSaveBtn');
    const orig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Saving...';
    try {
      let photo_url;
      if (photoFile) {
        btn.innerHTML = '<i class="fas fa-cloud-upload-alt fa-spin mr-1"></i>Uploading...';
        photo_url = await uploadDoctorPhoto(photoFile, email);
      }
      const payload = {
        display_name: name,
        specialty: spec,
        bio,
        is_active: isActive,
        permissions: { view_own_only: viewOwn, can_approve: canApprove, can_cancel: canCancel, is_admin: false },
      };
      if (photo_url)          payload.photo_url       = photo_url;
      if (newPass.length >= 4) payload.doctor_password = newPass;
      const { error } = await sbClient.from('doctor_profiles').update(payload).eq('id', id);
      if (error) throw error;
      showToast('Doctor updated successfully!', 'success');
      const epf = document.getElementById('editDocPassword'); if (epf) epf.value = '';
      closeModal('editDoctorModal');
      await loadDoctorProfiles();
      loadAdminDoctors();
      loadInlineAdminDoctors();
    } catch(err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      btn.disabled = false; btn.innerHTML = orig;
    }
  };

  window.adminDeleteDoctor = function(id, name) {
    document.getElementById('confirmTitle').textContent = 'Delete Doctor';
    document.getElementById('confirmMsg').textContent = `Are you sure you want to permanently delete Dr. ${name}? This cannot be undone.`;
    const iconEl = document.getElementById('confirmIcon');
    iconEl.className = 'w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-500/20';
    document.getElementById('confirmIconEl').className = 'fas fa-trash-alt text-red-400 text-2xl';
    const btn = document.getElementById('confirmProceedBtn');
    btn.className = 'flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors';
    btn.onclick = async function() {
      closeModal('confirmActionModal');
      try {
        const { error } = await sbClient.from('doctor_profiles').delete().eq('id', id);
        if (error) throw error;
        showToast(`Dr. ${name} deleted.`, 'success');
        await loadDoctorProfiles();
        loadAdminDoctors();
        loadInlineAdminDoctors();
      } catch(err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    };
    openModal('confirmActionModal');
  };


/* ========== ADMIN — EDIT & DELETE APPOINTMENT ========== */

  // ===========================
  // ADMIN — EDIT & DELETE APPOINTMENT
  // ===========================
  window.adminEditAppt = function(apptJson) {
    const a = typeof apptJson === 'string' ? JSON.parse(apptJson) : apptJson;
    document.getElementById('editApptId').value = a.id;
    document.getElementById('editApptName').value = a.patient_name || '';
    document.getElementById('editApptAge').value = a.patient_age || '';
    document.getElementById('editApptGender').value = a.patient_gender || '';
    document.getElementById('editApptSpecialty').value = a.specialty || 'internal';
    document.getElementById('editApptEmail').value = a.patient_email || '';
    document.getElementById('editApptPhone').value = a.phone || '';
    document.getElementById('editApptDate').value = a.preferred_date || '';
    document.getElementById('editApptStatus').value = safeStatus(a.status);
    document.getElementById('editApptDoctor').value = a.doctor_name || '';
    document.getElementById('editApptNotes').value = a.notes || '';
    openModal('editApptModal');
  };

  window.adminSaveEditAppt = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editApptId').value;
    const btn = document.getElementById('editApptSaveBtn');
    const orig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Saving...';
    try {
      const payload = {
        patient_name:   document.getElementById('editApptName').value.trim(),
        patient_age:    parseInt(document.getElementById('editApptAge').value) || null,
        patient_gender: document.getElementById('editApptGender').value || null,
        specialty:      document.getElementById('editApptSpecialty').value,
        patient_email:  document.getElementById('editApptEmail').value.trim() || null,
        phone:          document.getElementById('editApptPhone').value.trim() || null,
        preferred_date: document.getElementById('editApptDate').value || null,
        status:         document.getElementById('editApptStatus').value,
        doctor_name:    document.getElementById('editApptDoctor').value.trim() || null,
        notes:          document.getElementById('editApptNotes').value.trim() || null,
      };
      const { error } = await sbClient.from('appointments').update(payload).eq('id', id);
      if (error) throw error;
      showToast('Appointment updated successfully!', 'success');
      closeModal('editApptModal');
      await loadInlineAdminStats();
      loadAdminAppts();
      loadInlineAdminAppts();
    } catch(err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      btn.disabled = false; btn.innerHTML = orig;
    }
  };

  window.adminDeleteAppt = function(id, patientName) {
    document.getElementById('confirmTitle').textContent = 'Delete Appointment';
    document.getElementById('confirmMsg').textContent = `Are you sure you want to permanently delete the appointment for ${patientName}? This cannot be undone.`;
    const iconEl = document.getElementById('confirmIcon');
    iconEl.className = 'w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-500/20';
    document.getElementById('confirmIconEl').className = 'fas fa-trash-alt text-red-400 text-2xl';
    const btn = document.getElementById('confirmProceedBtn');
    btn.className = 'flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors';
    btn.onclick = async function() {
      closeModal('confirmActionModal');
      try {
        const { error } = await sbClient.from('appointments').delete().eq('id', id);
        if (error) throw error;
        showToast('Appointment deleted.', 'success');
        await loadInlineAdminStats();
        loadAdminAppts();
        loadInlineAdminAppts();
      } catch(err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    };
    openModal('confirmActionModal');
  };


