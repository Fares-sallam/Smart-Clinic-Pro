/* =====================================================================
 * page.js — Core / Public site (Smart Clinic Pro)
 * الصفحة العامة: الإعدادات، الترجمة، النوافذ، قسم الأطباء العام، المحادثة،
 * تسجيل الدخول/الحساب، الحجز، لوحة المريض، والدفع.
 * Loaded FIRST. Defines all shared state + helpers used by doctors.js & admin.js.
 * ===================================================================== */

/* ---------- GLOBAL SETUP: Tailwind config + Supabase client ---------- */

window.tailwind = window.tailwind || {};
window.tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'Noto Sans', 'sans-serif'],
            serif: ['Playfair Display', 'serif'],
            arabic: ['Noto Sans Arabic', 'sans-serif'],
          },
          colors: {
            brand: {
              50:  '#edfcfc',
              100: '#d1f5f7',
              200: '#a8ecf1',
              300: '#6fddea',
              400: '#2fc4da',
              500: '#14a8c0',
              600: '#0e87a0',
              700: '#116d82',
              800: '#175a6b',
              900: '#184c5b',
              950: '#0a2f3a',
            },
            gold: {
              400: '#fbbf24',
              500: '#f59e0b',
              600: '#d97706',
            },
            dark: {
              900: '#050b1a',
              800: '#0a1628',
              700: '#0f1f3a',
              600: '#162545',
              500: '#1e3054',
            }
          },
          backgroundImage: {
            'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          }
        }
      }
    };

// Supabase client (global)
const SUPABASE_URL = 'https://lpkomugzaccgrmcsbjlz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwa29tdWd6YWNjZ3JtY3Niamx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzU4MTIsImV4cCI6MjA5MzQxMTgxMn0.MAG8EtfXJuMdV3Xzy-BAB41ipzn2G7FjLPwNcBqO5KY';

function createUnavailableSupabaseClient() {
  const unavailableError = new Error('Supabase client is unavailable. Check the CDN script or network connection.');
  const createQuery = () => {
    const query = {
      select() { return query; },
      eq() { return query; },
      order() { return query; },
      limit() { return query; },
      insert() { return query; },
      update() { return query; },
      upsert() { return query; },
      single() { return Promise.resolve({ data: null, error: unavailableError }); },
      then(resolve, reject) {
        return Promise.resolve({ data: [], error: unavailableError, count: 0 }).then(resolve, reject);
      },
    };
    return query;
  };

  return {
    from() { return createQuery(); },
    auth: {
      getSession: async () => ({ data: { session: null }, error: unavailableError }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: null, error: unavailableError }),
      signInWithOtp: async () => ({ data: null, error: unavailableError }),
      resetPasswordForEmail: async () => ({ data: null, error: unavailableError }),
      verifyOtp: async () => ({ data: null, error: unavailableError }),
      updateUser: async () => ({ data: null, error: unavailableError }),
      signOut: async () => ({ error: null }),
    },
    functions: {
      invoke: async () => ({ data: null, error: unavailableError }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: unavailableError }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  };
}

// Assign to window to avoid shadowing window.supabase (the CDN library object).
window.sbClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createUnavailableSupabaseClient();

if (!window.supabase?.createClient) {
  console.warn('Supabase CDN did not load; using a read-only fallback for the public UI.');
}


/* ---------- PAGE / SHARED / PATIENT ---------- */


  // ===========================
  // DATA
  // ===========================

  // Doctors loaded dynamically from Supabase doctor_profiles
  let doctors = [];
  /* fallbackDoctorProfiles → moved to data.js */

  // Gender-based doctor photo pools — each photo unique, never shared between genders
  const _doctorPhotoPool = {
    female: [
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop&crop=face',
    ],
    male: [
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1584999734482-0361aecad844?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1612531386530-97286d97c2b2?w=400&h=400&fit=crop&crop=face',
    ],
  };
  let _usedDoctorPhotos = new Set();
  function _resetUsedPhotos() { _usedDoctorPhotos = new Set(); }
  // Simple gender inference from the first name
  function _inferGender(displayName) {
    const first = (displayName || '').replace(/^Dr\.?\s*/i, '').split(/\s+/)[0]?.toLowerCase() || '';
    if (['sarah','aisha','elena','linda','emma','olivia','sophia','isabella','mia','charlotte','amelia','harper','evelyn','abigail','ella','ava','sofia','camila','aria','scarlett','victoria','madison','luna','grace','chloe','penelope','layla','riley','zoey','nora','lily','eleanor','hannah','lillian','addison','aubrey','ellie','ira','nadia','fatima','zahra','maryam','asma','noor','hala','amina','samira','leila','dalia','rania','lina','yara','emma','sakura','mei','chen'].includes(first)) return 'female';
    if (['michael','james','robert','john','david','william','richard','joseph','thomas','christopher','charles','daniel','matthew','anthony','mark','donald','steven','paul','andrew','joshua','kenneth','kevin','brian','george','timothy','ronald','edward','jason','jeffrey','ryan','jacob','gary','nicholas','eric','jonathan','stephen','larry','justin','scott','brandon','benjamin','samuel','raymond','gregory','frank','alexander','patrick','ahmed','ali','omar','hassan','wei'].includes(first)) return 'male';
    return null;
  }
  function getDocImg(specialty, name) {
    const gender = _inferGender(name);
    const pool = gender ? _doctorPhotoPool[gender] : _doctorPhotoPool.male.concat(_doctorPhotoPool.female);
    const hash = Math.abs(name.split('').reduce((a,c)=>a+c.charCodeAt(0),0));
    let idx = hash % pool.length;
    const start = idx;
    do {
      if (!_usedDoctorPhotos.has(pool[idx])) {
        _usedDoctorPhotos.add(pool[idx]);
        return pool[idx];
      }
      idx = (idx + 1) % pool.length;
    } while (idx !== start);
    return pool[hash % pool.length];
  }

  // Map specialty string to short key
  function specKey(specialty) {
    const s = (specialty||'').toLowerCase();
    if (s.includes('internal')) return 'internal';
    if (s.includes('dent')) return 'dentistry';
    if (s.includes('ortho')) return 'ortho';
    return 'default';
  }
  const _specColorMap = { internal:'blue', dentistry:'cyan', ortho:'purple', default:'brand' };

  function mapDoctorProfile(d, i) {
    const sk = specKey(d.specialty);
    const displayName = d.display_name || d.name || 'Smart Clinic Doctor';
    return {
      id: d.id || `doctor-${i}`,
      name: displayName,
      specialty: sk,
      specialtyLabel: d.specialty || 'General',
      rating: 4.8,
      reviews: 100 + i * 37,
      experience: '8+ years',
      bio: d.bio || `${displayName} is a dedicated specialist in ${d.specialty || 'General Medicine'} committed to exceptional patient care.`,
      img: d.photo_url || getDocImg(sk, displayName),
      color: _specColorMap[sk] || 'brand',
      qualifications: d.specialty || 'Board Certified',
      available: d.is_active !== false,
      email: d.email || null,
      phone: d.phone || null,
      hasRealPhoto: !!d.photo_url,
    };
  }

  function renderFallbackDoctors(reason) {
    if (reason) console.warn('Using fallback doctors:', reason);
    _resetUsedPhotos();
    doctors = fallbackDoctorProfiles.map(mapDoctorProfile);
    renderDoctors('all');
    updateBookingDoctorDropdown();
  }

  async function loadDoctorsFromDB() {
    try {
      const query = window.sbClient
        .from('doctor_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      const result = await Promise.race([
        query,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase query timed out')), 2000)),
      ]);
      const { data, error } = result;
      if (error) throw error;
      const profiles = data?.length ? data : fallbackDoctorProfiles;
      _resetUsedPhotos();
      if (profiles === data && !data.every(d => d.display_name || d.name)) {
        console.warn('loadDoctorsFromDB: Supabase data has unexpected fields; using fallback');
        doctors = fallbackDoctorProfiles.map(mapDoctorProfile);
      } else {
        doctors = profiles.map(mapDoctorProfile);
      }
      renderDoctors('all');
      updateBookingDoctorDropdown();
    } catch(err) {
      console.warn('loadDoctorsFromDB:', err);
      renderFallbackDoctors(err.message);
    }
  }

  /* testimonials, translations, healthQuotes, searchData → moved to data.js */

  // ===========================
  // STATE
  // ===========================
  let currentLang = 'en';
  let isChatOpen = false;
  let currentFilter = 'all';

  // ===========================
  // INIT
  // ===========================
  function init() {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    document.body.style.removeProperty('background');
    document.body.style.removeProperty('color');
    applyi18n();
    renderDoctorsLoading();
    renderTestimonials();
    startTypingAnimation();
    animateCounters();
    animateProgressBars();
    initStyleTabs();
    initSpecialtyTabStyles();
    // Scroll-triggered progress bars
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.progress-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.target + '%';
          });
        }
      });
    }, { threshold: 0.3 });
    const aboutSection = document.getElementById('about');
    if (aboutSection) observer.observe(aboutSection);
    // Header scroll effect
    window.addEventListener('scroll', () => {
      const header = document.getElementById('mainHeader');
      if (window.scrollY > 20) {
        header.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }

  // ===========================
  // LANGUAGE
  // ===========================
  window.setLanguage = function(lang) {
    currentLang = lang;
    const html = document.documentElement;
    if (lang === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', lang);
    }
    applyi18n();
    renderDoctors(currentFilter);
    renderTestimonials();
  };

  function applyi18n() {
    const t = translations[currentLang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key]) el.setAttribute('placeholder', t[key]);
    });
    // Tagline
    const taglineEl = document.getElementById('taglineText');
    if (taglineEl && t.tagline) taglineEl.textContent = t.tagline;
  }

  function t(key) {
    return (translations[currentLang] || translations.en)[key] || (translations.en)[key] || key;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function jsArg(value) {
    return escapeHtml(JSON.stringify(String(value ?? '')));
  }

  function safeStatus(value) {
    const allowed = ['pending', 'approved', 'postponed', 'cancelled', 'completed'];
    const status = String(value || 'pending').toLowerCase();
    return allowed.includes(status) ? status : 'pending';
  }

  function safePaymentMethod(value) {
    const allowed = ['card', 'mir', 'apple', 'cash'];
    const method = String(value || 'card').toLowerCase();
    return allowed.includes(method) ? method : 'card';
  }

  function capitalize(value) {
    const text = String(value || '');
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }



  // ===========================
  // DROPDOWNS
  // ===========================
  window.toggleDropdown = function(id) {
    const all = ['dd-about','dd-doctors','dd-contact','dd-lang'];
    all.forEach(ddId => {
      const el = document.getElementById(ddId);
      if (!el) return;
      if (ddId === id) {
        el.classList.toggle('open');
      } else {
        el.classList.remove('open');
      }
    });
  };
  window.closeAllDropdowns = function() {
    ['dd-about','dd-doctors','dd-contact','dd-lang'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('open');
    });
  };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) closeAllDropdowns();
  });

  // ===========================
  // MOBILE MENU
  // ===========================
  window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('mobileMenuIcon');
    menu.classList.toggle('open');
    if (menu.classList.contains('open')) {
      icon.classList.replace('fa-bars','fa-times');
    } else {
      icon.classList.replace('fa-times','fa-bars');
    }
  };
  window.closeMobileMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('mobileMenuIcon');
    menu.classList.remove('open');
    icon.classList.replace('fa-times','fa-bars');
  };

  // ===========================
  // SEARCH
  // ===========================
  window.toggleSearch = function() {
    const bar = document.getElementById('searchBar');
    bar.classList.toggle('hidden');
    if (!bar.classList.contains('hidden')) {
      setTimeout(() => document.getElementById('searchInput').focus(), 100);
    } else {
      document.getElementById('searchResults').classList.add('hidden');
    }
  };

  window.performSearch = function(query) {
    const resultsEl = document.getElementById('searchResults');
    if (!query.trim()) { resultsEl.classList.add('hidden'); return; }
    const q = query.toLowerCase();
    const results = searchData.filter(item =>
      item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    );
    if (!results.length) {
      resultsEl.classList.remove('hidden');
      resultsEl.innerHTML = `<div class="p-4 text-center text-sm text-slate-500">No results found for "<span class="text-white">${escapeHtml(query)}</span>"</div>`;
      return;
    }
    const icons = { doctor: 'fa-user-md text-brand-400', service: 'fa-stethoscope text-gold-400', page: 'fa-file-alt text-purple-400' };
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = results.map(r => `
      <a href="${r.href}" onclick="closeSearch()" class="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
        <div class="w-7 h-7 rounded-lg glass flex items-center justify-center flex-shrink-0">
          <i class="fas ${icons[r.type] || 'fa-search text-slate-400'} text-xs"></i>
        </div>
        <div>
          <div class="text-sm font-medium text-white">${escapeHtml(r.label)}</div>
          <div class="text-xs text-slate-500">${escapeHtml(r.sub)}</div>
        </div>
        <div class="ml-auto text-xs text-slate-600 capitalize">${r.type}</div>
      </a>
    `).join('');
  };

  window.closeSearch = function() {
    document.getElementById('searchBar').classList.add('hidden');
    document.getElementById('searchResults').classList.add('hidden');
  };

  // ===========================
  // MODALS
  // ===========================
  window.openModal = function(id) {
    // 'bookingModal' doesn't exist — booking UI is an inline section
    if (id === 'bookingModal') {
      const section = document.getElementById('booking');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (!el) { console.warn('openModal: element not found:', id); return; }
    el.classList.remove('hidden');
    el.classList.add('flex');
    setTimeout(() => {
      const box = el.querySelector('.modal-box');
      if (box) { box.style.transform = 'scale(1) translateY(0)'; box.style.opacity = '1'; }
    }, 10);
    document.body.style.overflow = 'hidden';
  };
  window.closeModal = function(id) {
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.classList.remove('flex');
    document.body.style.overflow = '';
  };

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // ===========================
  // DOCTORS
  // ===========================
  function renderDoctorsLoading() {
    const grid = document.getElementById('doctorsGrid');
    grid.innerHTML = Array.from({length:3}).map(()=>`
      <div class="light-card rounded-3xl overflow-hidden animate-pulse">
        <div class="w-full h-52 bg-white/10"></div>
        <div class="p-5 space-y-3">
          <div class="h-4 bg-white/15 rounded-xl w-3/4"></div>
          <div class="h-3 bg-white/10 rounded-xl w-1/2"></div>
          <div class="h-12 bg-white/10 rounded-xl"></div>
          <div class="h-3 bg-white/10 rounded-xl w-2/3"></div>
        </div>
      </div>
    `).join('');
  }

  const colorMap = {
    blue: { badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300', icon: 'text-blue-400', dot: 'bg-blue-500' },
    cyan: { badge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300', icon: 'text-cyan-400', dot: 'bg-cyan-500' },
    purple: { badge: 'bg-purple-500/15 border-purple-500/30 text-purple-300', icon: 'text-purple-400', dot: 'bg-purple-500' },
    red: { badge: 'bg-red-500/15 border-red-500/30 text-red-300', icon: 'text-red-400', dot: 'bg-red-500' },
    brand: { badge: 'bg-brand-500/15 border-brand-500/30 text-brand-300', icon: 'text-brand-400', dot: 'bg-brand-500' },
  };
  const specIcons = { internal: 'fa-stethoscope', dentistry: 'fa-tooth', ortho: 'fa-bone' };

  function renderDoctors(filter) {
    currentFilter = filter;
    const grid = document.getElementById('doctorsGrid');
    const filtered = filter === 'all' ? doctors : doctors.filter(d => d.specialty === filter);
    if (!filtered.length) {
      grid.innerHTML = `
        <div class="sm:col-span-2 lg:col-span-3 text-center py-12 glass border border-white/10 rounded-3xl">
          <div class="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-3">
            <i class="fas fa-user-md text-brand-400 text-xl"></i>
          </div>
          <p class="text-sm text-slate-400">No doctors are available for this specialty yet.</p>
        </div>
      `;
      return;
    }
    grid.innerHTML = filtered.map(doc => {
      const c = colorMap[doc.color] || colorMap.blue;
      const stars = Array.from({length: 5}, (_, i) => `<i class="fas fa-star ${i < Math.floor(doc.rating) ? 'star-filled' : 'star-empty'} text-xs"></i>`).join('');
      const specLabel = t('spec_' + doc.specialty);
      const safeName = escapeHtml(doc.name);
      const safeSpecLabel = escapeHtml(specLabel);
      const safeImg = escapeHtml(doc.img);
      const safeBio = escapeHtml(doc.bio);
      const safeQualifications = escapeHtml(doc.qualifications);
      return `
        <div class="doctor-card light-card rounded-3xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-500/10" onclick="openDoctorDetail('${escapeHtml(doc.id)}')">
          <div class="relative">
            <img src="${safeImg}" alt="Portrait of ${safeName}, ${safeSpecLabel} specialist at Smart Clinic Pro" class="w-full h-52 object-cover ${doc.hasRealPhoto ? 'object-center' : 'object-top'}" loading="lazy" decoding="async" />
            <div class="absolute top-3 left-3">
              <span class="px-2.5 py-1 rounded-full border text-xs font-medium ${c.badge}">
                <i class="fas ${specIcons[doc.specialty] || 'fa-user-md'} mr-1"></i>${safeSpecLabel}
              </span>
            </div>
            <div class="absolute top-3 right-3">
              <span class="px-2 py-1 rounded-full ${doc.available ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-slate-500/20 border border-slate-500/40 text-slate-400'} text-xs">
                ${doc.available ? '● Available' : '● Unavailable'}
              </span>
            </div>
          </div>
          <div class="p-5">
            <h3 class="text-base font-bold text-white mb-0.5">${safeName}</h3>
            <p class="text-xs text-slate-500 mb-3">${safeQualifications}</p>
            <p class="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">${safeBio}</p>
            <div class="flex items-center gap-2 mb-4">
              <div class="flex gap-0.5">${stars}</div>
              <span class="text-sm font-semibold text-white">${doc.rating}</span>
              <span class="text-xs text-slate-500">(${doc.reviews} reviews)</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-xs text-slate-500"><i class="fas fa-clock mr-1 ${c.icon}"></i>${doc.experience} experience</div>
              <button onclick="openModal('bookingModal')" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-all hover:scale-105 animate__animated" onmouseenter="this.classList.add('animate__pulse')">
                <i class="fas fa-calendar-plus mr-1"></i>Book
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update booking dropdown dynamically from loaded doctor_profiles
  function updateBookingDoctorDropdown() {
    const specEl = document.getElementById('bookingSpecialty');
    if (specEl) updateDoctorSelect();
  }

  window.filterDoctors = function(specialty) {
    renderDoctors(specialty);
    document.querySelectorAll('.specialty-tab').forEach(tab => {
      const isActive = (specialty === 'all' && tab.textContent.trim() === (translations[currentLang]?.tab_all || 'All')) ||
                       tab.getAttribute('onclick')?.includes(`'${specialty}'`);
      if (isActive) {
        tab.classList.add('bg-brand-600', 'text-white', 'shadow-lg');
        tab.classList.remove('text-slate-400', 'bg-white/5', 'hover:bg-white/10');
      } else {
        tab.classList.remove('bg-brand-600', 'text-white', 'shadow-lg');
        tab.classList.add('text-slate-400', 'bg-white/5', 'hover:bg-white/10');
      }
    });
  };

  function initSpecialtyTabStyles() {
    document.querySelectorAll('.specialty-tab').forEach(tab => {
      tab.classList.add('text-slate-400', 'bg-white/5', 'hover:bg-white/10', 'transition-all');
    });
    // Activate "All" tab initially
    const allTab = document.querySelector('.specialty-tab');
    if (allTab) {
      allTab.classList.add('bg-brand-600', 'text-white', 'shadow-lg');
      allTab.classList.remove('text-slate-400', 'bg-white/5', 'hover:bg-white/10');
    }
  }

  // ===========================
  // DOCTOR DETAIL MODAL + INQUIRY CHAT
  // ===========================
  function _findDoctorById(id) {
    return doctors.find(d => d.id === id);
  }
  window.openDoctorDetail = function(id) {
    const doc = _findDoctorById(id);
    if (!doc) return;
    // Populate modal
    const c = colorMap[doc.color] || colorMap.blue;
    const specLabel = t('spec_' + doc.specialty);
    const stars = Array.from({length: 5}, (_, i) => `<i class="fas fa-star ${i < Math.floor(doc.rating) ? 'star-filled' : 'star-empty'} text-xs"></i>`).join('');
    document.getElementById('ddPhoto').src = doc.img;
    document.getElementById('ddPhoto').alt = doc.name;
    document.getElementById('ddSpecialtyBadge').className = `px-3 py-1 rounded-full border text-xs font-medium ${c.badge}`;
    document.getElementById('ddSpecialtyBadge').innerHTML = `<i class="fas ${specIcons[doc.specialty] || 'fa-user-md'} mr-1"></i>${specLabel}`;
    document.getElementById('ddAvailability').className = `px-2.5 py-1 rounded-full text-xs font-medium ${doc.available ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-slate-500/20 border border-slate-500/40 text-slate-400'}`;
    document.getElementById('ddAvailability').textContent = doc.available ? '● Available' : '● Unavailable';
    document.getElementById('ddName').textContent = doc.name;
    document.getElementById('ddQualifications').textContent = doc.qualifications;
    document.getElementById('ddStars').innerHTML = stars;
    document.getElementById('ddRating').textContent = doc.rating;
    document.getElementById('ddReviews').textContent = `(${doc.reviews} reviews)`;
    document.getElementById('ddBio').textContent = doc.bio;
    document.getElementById('ddExperience').textContent = doc.experience;
    document.getElementById('ddPatients').textContent = (doc.reviews * 3).toLocaleString();

    // Store doctor email for inquiry chat
    document.getElementById('doctorDetailModal').dataset.doctorEmail = doc.email || '';

    // Show inquiry section if logged in as patient, else login prompt
    const inquirySection = document.getElementById('ddInquirySection');
    const loginPrompt = document.getElementById('ddLoginPrompt');
    if (currentUser && !isDoctor(currentUser.email) && !isAdmin(currentUser.email)) {
      inquirySection.classList.remove('hidden');
      loginPrompt.classList.add('hidden');
      loadDoctorInquiryChat();
    } else if (currentUser) {
      inquirySection.classList.add('hidden');
      loginPrompt.classList.add('hidden');
    } else {
      inquirySection.classList.add('hidden');
      loginPrompt.classList.remove('hidden');
    }

    openModal('doctorDetailModal');
  };

  // Inquiry chat (localStorage-based, keyed by patient+doctor email)
  function _inquiryKey(patientEmail, doctorEmail) {
    return 'scp_inquiry_' + btoa(patientEmail.toLowerCase().trim() + '|' + (doctorEmail || '').toLowerCase().trim());
  }
  function _getInquiryMessages(patientEmail, doctorEmail) {
    try {
      return JSON.parse(localStorage.getItem(_inquiryKey(patientEmail, doctorEmail)) || '[]');
    } catch { return []; }
  }
  function _saveInquiryMessages(patientEmail, doctorEmail, msgs) {
    localStorage.setItem(_inquiryKey(patientEmail, doctorEmail), JSON.stringify(msgs));
  }

  window.loadDoctorInquiryChat = function() {
    const container = document.getElementById('ddChatMessages');
    if (!container) return;
    const doctorEmail = document.getElementById('doctorDetailModal').dataset.doctorEmail;
    const patientEmail = currentUser?.email;
    if (!patientEmail) { container.innerHTML = ''; return; }
    const messages = _getInquiryMessages(patientEmail, doctorEmail);
    if (!messages.length) {
      container.innerHTML = '<div class="text-center py-6"><div class="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center mx-auto mb-2"><i class="fas fa-comment-dots text-brand-400 text-sm"></i></div><p class="text-xs text-slate-500">No messages yet</p><p class="text-[10px] text-slate-600 mt-0.5">Send a message to the doctor</p></div>';
      return;
    }
    container.innerHTML = messages.map(m => {
      const isMine = m.role === 'patient';
      const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `<div class="flex ${isMine ? 'justify-end' : 'justify-start'}"><div class="max-w-[80%] ${isMine ? 'bg-brand-600/80 text-white rounded-2xl rounded-br-md' : 'bg-white/10 text-slate-200 rounded-2xl rounded-bl-md'} px-3 py-2 text-sm shadow-sm"><div class="break-words">${escapeHtml(m.text)}</div><div class="flex items-center ${isMine ? 'justify-end' : 'justify-start'} gap-1 mt-0.5"><span class="text-[9px] ${isMine ? 'opacity-60' : 'text-slate-500'}">${time}</span></div></div></div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  };

  window.sendDoctorInquiry = async function() {
    const input = document.getElementById('ddChatInput');
    const text = input.value.trim();
    if (!text) return;
    const doctorEmail = document.getElementById('doctorDetailModal').dataset.doctorEmail;
    const patientEmail = currentUser?.email;
    if (!patientEmail || !doctorEmail) return;

    // Add patient message
    const messages = _getInquiryMessages(patientEmail, doctorEmail);
    messages.push({ role: 'patient', text, time: new Date().toISOString() });
    _saveInquiryMessages(patientEmail, doctorEmail, messages);
    input.value = '';
    loadDoctorInquiryChat();

    // Simulate auto-reply after short delay
    const ddContainer = document.getElementById('ddChatMessages');
    const tId = 'dd-typing-' + Date.now();
    if (ddContainer) {
      ddContainer.innerHTML += `<div id="${tId}" class="flex items-end gap-2 mt-2">
        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-user-md text-white text-[9px]"></i>
        </div>
        <div class="msg-in"><div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>
      </div>`;
      ddContainer.scrollTop = ddContainer.scrollHeight;
    }
    setTimeout(() => {
      const tEl = document.getElementById(tId);
      if (tEl) tEl.remove();
      const msgs = _getInquiryMessages(patientEmail, doctorEmail);
      const replies = [
        'Thank you for your inquiry. I will review and get back to you shortly.',
        'Thanks for reaching out. Let me check and respond as soon as possible.',
        'I appreciate your message. I will be in touch soon with more information.',
      ];
      msgs.push({
        role: 'doctor',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toISOString(),
      });
      _saveInquiryMessages(patientEmail, doctorEmail, msgs);
      loadDoctorInquiryChat();
    }, 1500);
  };

  // ===========================
  // TESTIMONIALS
  // ===========================
  let _testimonialsFullList = [];
  function renderTestimonials() {
    _testimonialsFullList = testimonials.slice();
    const show = _testimonialsFullList.slice(0, 4);
    const grid = document.getElementById('testimonialGrid');
    const btn = document.getElementById('testimonialMoreBtn');
    const wrap = document.getElementById('testimonialMoreWrap');
    if (!grid) return;
    grid.innerHTML = show.map(t => {
      const stars = Array.from({length: 5}, (_, i) => `<i class="fas fa-star ${i < t.rating ? 'text-gold-400' : 'text-white/10'} text-xs"></i>`).join('');
      return `
        <div class="glass border border-white/8 rounded-3xl p-5 flex flex-col relative overflow-hidden group hover:border-brand-500/25 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300">
          <div class="absolute -top-4 -left-2 text-7xl text-brand-500/8 font-serif leading-none select-none">"</div>
          <div class="flex gap-0.5 mb-3 relative">${stars}</div>
          <p class="text-sm text-slate-400 leading-relaxed mb-5 relative flex-1">${t.text}</p>
          <div class="flex items-center gap-3 relative pt-3 border-t border-white/5">
            <div class="relative flex-shrink-0">
              <img src="${t.img}" alt="${t.name}" class="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/20" loading="lazy" decoding="async" />
              <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-dark-900 flex items-center justify-center"><i class="fas fa-check text-[5px] text-white"></i></div>
            </div>
            <div class="min-w-0">
              <div class="text-sm font-semibold text-white truncate">${t.name}</div>
              <div class="text-[11px] text-slate-500 flex items-center gap-1"><i class="fas fa-calendar-alt text-[8px] text-brand-400/60"></i>${t.role}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    if (btn) btn.style.display = _testimonialsFullList.length > 4 ? 'inline-flex' : 'none';
    if (wrap) wrap.style.display = _testimonialsFullList.length > 4 ? 'block' : 'none';
  }
  window.showAllTestimonials = function() {
    const grid = document.getElementById('testimonialGrid');
    const btn = document.getElementById('testimonialMoreBtn');
    const wrap = document.getElementById('testimonialMoreWrap');
    if (!grid) return;
    grid.innerHTML = _testimonialsFullList.map(t => {
      const stars = Array.from({length: 5}, (_, i) => `<i class="fas fa-star ${i < t.rating ? 'text-gold-400' : 'text-white/10'} text-xs"></i>`).join('');
      return `
        <div class="glass border border-white/8 rounded-3xl p-5 flex flex-col relative overflow-hidden group hover:border-brand-500/25 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300">
          <div class="absolute -top-4 -left-2 text-7xl text-brand-500/8 font-serif leading-none select-none">"</div>
          <div class="flex gap-0.5 mb-3 relative">${stars}</div>
          <p class="text-sm text-slate-400 leading-relaxed mb-5 relative flex-1">${t.text}</p>
          <div class="flex items-center gap-3 relative pt-3 border-t border-white/5">
            <div class="relative flex-shrink-0">
              <img src="${t.img}" alt="${t.name}" class="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/20" loading="lazy" decoding="async" />
              <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-dark-900 flex items-center justify-center"><i class="fas fa-check text-[5px] text-white"></i></div>
            </div>
            <div class="min-w-0">
              <div class="text-sm font-semibold text-white truncate">${t.name}</div>
              <div class="text-[11px] text-slate-500 flex items-center gap-1"><i class="fas fa-calendar-alt text-[8px] text-brand-400/60"></i>${t.role}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    if (btn) btn.style.display = 'none';
    if (wrap) wrap.style.display = 'none';
  };

  // ===========================
  // TYPING ANIMATION
  // ===========================
  let quoteIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingEl = document.getElementById('typingQuote');

  function startTypingAnimation() {
    if (!typingEl) return;
    function type() {
      const current = healthQuotes[quoteIndex];
      if (!isDeleting) {
        typingEl.textContent = current.slice(0, ++charIndex);
        if (charIndex === current.length) { isDeleting = true; setTimeout(type, 2500); return; }
      } else {
        typingEl.textContent = current.slice(0, --charIndex);
        if (charIndex === 0) { isDeleting = false; quoteIndex = (quoteIndex + 1) % healthQuotes.length; }
      }
      setTimeout(type, isDeleting ? 35 : 55);
    }
    type();
  }

  // ===========================
  // COUNTERS
  // ===========================
  function animateCounters() {
    const counters = document.querySelectorAll('.counter-num');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target);
          let start = 0;
          const step = target / 60;
          const timer = setInterval(() => {
            start = Math.min(start + step, target);
            el.textContent = Math.floor(start).toLocaleString();
            if (start >= target) clearInterval(timer);
          }, 25);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
  }

  // ===========================
  // PROGRESS BARS
  // ===========================
  function animateProgressBars() {
    // Bars animate via IntersectionObserver set during init
    document.querySelectorAll('.progress-bar-fill').forEach(b => { b.style.width = '0%'; });
  }

  // ===========================
  // CHAT (Persistent via Supabase)
  // ===========================

  async function loadChatMessages(appointmentId) {
    try {
      const { data, error } = await sbClient
        .from('messages')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('loadChatMessages:', err);
      return [];
    }
  }

  async function sendChatMessageToDB(appointmentId, senderEmail, senderRole, message) {
    try {
      const { error } = await sbClient
        .from('messages')
        .insert({
          appointment_id: appointmentId,
          sender_email: senderEmail,
          sender_role: senderRole,
          message: message,
        });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('sendChatMessage:', err);
      return false;
    }
  }

  // Floating chat: patient sends message, linked to latest appointment or anonymous
  async function getOrCreateFloatingChatAppt() {
    const emailRaw = (document.getElementById('bookingEmail')?.value || '').trim() || currentUser?.email;
    const email = emailRaw ? emailRaw.toLowerCase().trim() : null;
    if (!email) return null;
    try {
      const { data } = await sbClient
        .from('appointments')
        .select('id, doctor_name, patient_name')
        .eq('patient_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    } catch {
      return null;
    }
  }

  // ===========================
  // FLOATING PATIENT CHAT — grouped by doctor (one conversation per doctor)
  // ===========================
  let _floatChatActive = null;   // { doctor, specialty, apptIds:[], sendApptId }
  let _floatChatGroups = [];

  function _floatSpecLabel(spec) {
    const key = specKey(spec);
    const label = t('spec_' + key);
    return (label && label !== 'spec_' + key) ? label : (spec || 'Doctor');
  }

  function _setFloatHeader(mode, title, subtitleHtml) {
    const back = document.getElementById('floatChatBack');
    const tEl  = document.getElementById('floatChatTitle');
    const sEl  = document.getElementById('floatChatSubtitle');
    if (tEl) tEl.textContent = title;
    if (sEl) sEl.innerHTML = subtitleHtml;
    if (back) back.classList.toggle('hidden', mode !== 'convo');
  }

  function _showFloatInput(show) {
    const bar = document.getElementById('floatChatInputBar');
    if (bar) bar.style.display = show ? 'flex' : 'none';
  }

  const _floatLoadingHTML = '<div class="flex items-center justify-center py-6 gap-2 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading…</span></div>';

  // Build the doctor-grouped conversation list for the logged-in patient
  async function _fetchFloatChatGroups() {
    const email = currentUser?.email?.toLowerCase().trim();
    if (!email) return [];
    let appts = [];
    try {
      const { data } = await sbClient.from('appointments')
        .select('id, doctor_name, specialty, preferred_date, created_at')
        .eq('patient_email', email)
        .order('created_at', { ascending: false });
      appts = data || [];
    } catch { return []; }
    const byDoctor = {};
    const groups = [];
    appts.forEach(a => {
      const doc = (a.doctor_name || '').trim();
      if (!doc || /^tbd$/i.test(doc)) return;            // skip appts with no assigned doctor
      if (!byDoctor[doc]) {
        // appts are ordered newest-first, so the first one seen is the most recent → send target
        byDoctor[doc] = { doctor: doc, specialty: a.specialty || '', apptIds: [], sendApptId: a.id, unread: 0 };
        groups.push(byDoctor[doc]);
      }
      byDoctor[doc].apptIds.push(a.id);
    });
    // Count doctor/admin replies per group (best-effort badge)
    const allIds = groups.flatMap(g => g.apptIds);
    if (allIds.length) {
      try {
        const { data: msgs } = await sbClient.from('messages').select('appointment_id, sender_role').in('appointment_id', allIds);
        if (msgs) groups.forEach(g => {
          g.unread = msgs.filter(m => g.apptIds.includes(m.appointment_id) && (m.sender_role === 'doctor' || m.sender_role === 'admin')).length;
        });
      } catch {}
    }
    return groups;
  }

  function _renderFloatWelcome(loggedInNoConvos) {
    _floatChatActive = null;
    _setFloatHeader('list', 'Smart Clinic Support', '<span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span> Online now');
    _showFloatInput(true);
    const hint = loggedInNoConvos
      ? 'Book an appointment with a doctor to start a conversation.'
      : 'Sign in and book an appointment to chat with your doctor.';
    document.getElementById('chatMessages').innerHTML =
      `<div class="flex items-end gap-2 mb-1">
        <div class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0"><i class="fas fa-user-md text-white text-xs"></i></div>
        <div class="msg-in px-4 py-2.5"><div class="text-sm leading-relaxed">👋 Welcome to Smart Clinic Pro! ${escapeHtml(hint)}</div><div class="text-[10px] text-slate-600 mt-1">Just now</div></div>
      </div>`;
  }

  function _renderFloatListView(groups) {
    _floatChatActive = null;
    _setFloatHeader('list', 'Messages', '<span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span> Your conversations');
    _showFloatInput(false);
    document.getElementById('chatMessages').innerHTML = groups.map((g, i) => {
      const initial = escapeHtml(((g.doctor || 'D').replace(/^Dr\.?\s*/i, '').charAt(0) || 'D').toUpperCase());
      const right = g.unread > 0
        ? `<span class="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">${g.unread > 9 ? '9+' : g.unread}</span>`
        : `<i class="fas fa-chevron-right text-slate-600 text-xs ml-auto flex-shrink-0"></i>`;
      return `<button onclick="openFloatChatGroup(${i})" class="w-full flex items-center gap-3 p-3 rounded-2xl glass border border-white/8 hover:border-brand-500/40 hover:bg-white/5 transition-all text-left mb-2">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold flex-shrink-0">${initial}</div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold text-white truncate">${escapeHtml(g.doctor)}</div>
          <div class="text-[11px] text-slate-400 truncate"><i class="fas fa-stethoscope mr-1 text-brand-400/60"></i>${escapeHtml(_floatSpecLabel(g.specialty))}</div>
        </div>
        ${right}
      </button>`;
    }).join('');
  }

  async function _renderFloatConvoMessages(group) {
    const container = document.getElementById('chatMessages');
    let msgs = [];
    try {
      const { data } = await sbClient.from('messages').select('*').in('appointment_id', group.apptIds).order('created_at', { ascending: true });
      msgs = data || [];
    } catch {}
    if (!msgs.length) {
      container.innerHTML = `<div class="text-center py-10"><div class="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2"><i class="fas fa-comment-dots text-brand-400"></i></div><p class="text-sm text-slate-400">No messages yet</p><p class="text-xs text-slate-600 mt-0.5">Send a message to ${escapeHtml(group.doctor)}</p></div>`;
    } else {
      container.innerHTML = _renderChatMessages(msgs, 'patient');
    }
    container.scrollTop = container.scrollHeight;
  }

  async function _openFloatConvo(group) {
    _floatChatActive = group;
    _setFloatHeader('convo', group.doctor, '<span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span> ' + escapeHtml(_floatSpecLabel(group.specialty)));
    _showFloatInput(true);
    document.getElementById('chatMessages').innerHTML = _floatLoadingHTML;
    await _renderFloatConvoMessages(group);
  }

  window.openFloatChatGroup = function(i) {
    const g = _floatChatGroups[i];
    if (g) _openFloatConvo(g);
  };

  // Back arrow → return to the doctor list (refreshes unread counts)
  window.floatChatBack = async function() {
    document.getElementById('chatMessages').innerHTML = _floatLoadingHTML;
    _floatChatGroups = await _fetchFloatChatGroups();
    if (!_floatChatGroups.length) { _renderFloatWelcome(true); return; }
    _renderFloatListView(_floatChatGroups);
  };

  // Default view when the widget opens
  async function loadFloatingChatList() {
    const email = currentUser?.email?.toLowerCase().trim();
    if (!email) { _renderFloatWelcome(false); return; }
    document.getElementById('chatMessages').innerHTML = _floatLoadingHTML;
    _floatChatGroups = await _fetchFloatChatGroups();
    if (!_floatChatGroups.length) { _renderFloatWelcome(true); return; }
    if (_floatChatGroups.length === 1) { _openFloatConvo(_floatChatGroups[0]); return; }  // single doctor → open directly
    _renderFloatListView(_floatChatGroups);
  }

  // Open the floating widget straight into a doctor conversation (used after booking)
  window.openChatForAppt = async function(apptId, doctorName, specialty) {
    closeModal('bookingSuccessModal');
    isChatOpen = true;
    const panel = document.getElementById('chatPanel');
    const icon  = document.getElementById('chatBtnIcon');
    const badge = document.getElementById('chatBadge');
    panel.style.display = 'flex'; panel.style.flexDirection = 'column';
    icon.classList.replace('fa-comments', 'fa-times');
    badge.classList.add('hidden');
    document.getElementById('chatMessages').innerHTML = _floatLoadingHTML;
    _floatChatGroups = await _fetchFloatChatGroups();
    let g = _floatChatGroups.find(x => x.apptIds.includes(apptId)) || _floatChatGroups.find(x => x.doctor === doctorName);
    if (!g) g = { doctor: doctorName || 'Doctor', specialty: specialty || '', apptIds: [apptId], sendApptId: apptId, unread: 0 };
    _openFloatConvo(g);
  };

  // Update the floating-button unread badge (called on auth changes)
  window.refreshChatBadge = async function() {
    const badge = document.getElementById('chatBadge');
    if (!badge) return;
    if (!currentUser?.email) { badge.classList.add('hidden'); return; }
    try {
      const groups = await _fetchFloatChatGroups();
      const unread = groups.reduce((s, g) => s + (g.unread || 0), 0);
      if (unread > 0 && !isChatOpen) { badge.textContent = unread > 9 ? '9+' : String(unread); badge.classList.remove('hidden'); }
      else badge.classList.add('hidden');
    } catch { badge.classList.add('hidden'); }
  };

  window.sendChatMessage = async function() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    const container = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic outgoing bubble
    container.innerHTML += `<div class="flex justify-end mt-2"><div class="msg-out px-4 py-2.5"><div class="text-sm leading-relaxed">${escapeHtml(msg)}</div><div class="flex items-center justify-end gap-1 mt-1.5"><span class="text-[10px] text-white/50">${time}</span><i class="fas fa-circle-notch fa-spin text-[9px] text-white/40 ml-0.5"></i></div></div></div>`;
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // ----- Real conversation with a specific doctor -----
    if (_floatChatActive) {
      const saved = await sendChatMessageToDB(_floatChatActive.sendApptId, currentUser?.email || 'patient', 'patient', msg);
      if (saved) await _renderFloatConvoMessages(_floatChatActive);   // re-load from DB (shows doctor replies too)
      else container.innerHTML += `<div class="text-center py-1 text-[10px] text-red-400">Message not saved — check connection</div>`;
      return;
    }

    // ----- Anonymous / support fallback (not tied to a doctor) -----
    const appt = await getOrCreateFloatingChatAppt();
    const senderEmail = appt?.patient_email || currentUser?.email || 'anonymous@visitor.com';
    const saved = await sendChatMessageToDB(appt?.id || null, senderEmail, 'patient', msg);
    if (!saved) {
      container.innerHTML += `<div class="flex justify-end"><div class="text-[10px] text-red-400 mt-1">Message not saved — check connection</div></div>`;
      return;
    }
    const typingId = 'typing-' + Date.now();
    container.innerHTML += `<div id="${typingId}" class="flex items-end gap-2 mt-2"><div class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center flex-shrink-0"><i class="fas fa-headset text-white text-[10px]"></i></div><div class="msg-in"><div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div></div>`;
    container.scrollTop = container.scrollHeight;
    setTimeout(() => {
      const tEl = document.getElementById(typingId);
      if (tEl) tEl.remove();
      const replies = [
        'Thank you for reaching out. Our team will get back to you shortly.',
        'Your message has been received. Please book an appointment for medical advice.',
        'Thanks for contacting Smart Clinic Pro! How can we assist you further?',
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const rt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      container.innerHTML += `<div class="flex items-end gap-2 mt-2"><div class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center flex-shrink-0"><i class="fas fa-headset text-white text-[10px]"></i></div><div class="msg-in px-4 py-2.5"><span class="text-[10px] text-brand-400 font-semibold block mb-1">Support</span><div class="text-sm leading-relaxed">${escapeHtml(reply)}</div><div class="text-[10px] text-slate-600 mt-1.5">${rt}</div></div></div>`;
      container.scrollTop = container.scrollHeight;
    }, 1400);
  };

  // Open/close the floating widget. On open: show the patient's doctor conversations.
  window.toggleChat = async function() {
    isChatOpen = !isChatOpen;
    const panel = document.getElementById('chatPanel');
    const icon = document.getElementById('chatBtnIcon');
    const badge = document.getElementById('chatBadge');
    if (isChatOpen) {
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';
      icon.classList.replace('fa-comments', 'fa-times');
      badge.classList.add('hidden');
      await loadFloatingChatList();
    } else {
      panel.style.display = 'none';
      icon.classList.replace('fa-times', 'fa-comments');
    }
  };

  // ===========================
  // CHAT HELPERS - Date separators, status, unified rendering
  // ===========================

  function _chatDateLabel(dateStr) {
    const date=new Date(dateStr);
    const today=new Date(); today.setHours(0,0,0,0);
    const yesterday=new Date(today); yesterday.setDate(yesterday.getDate()-1);
    const msgDate=new Date(date.getFullYear(),date.getMonth(),date.getDate());
    if(msgDate.getTime()===today.getTime()) return 'Today';
    if(msgDate.getTime()===yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  }

  function _chatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  }

  function _chatStatusHTML(status) {
    // status: 'sending', 'sent', 'delivered', 'read'
    const icons={sending:'fa-circle-notch fa-spin text-slate-500',sent:'fa-check text-slate-500',delivered:'fa-check-double text-slate-400',read:'fa-check-double text-blue-400'};
    return `<i class="fas ${icons[status]||icons.sent} text-[9px] ml-1"></i>`;
  }

  function _renderChatMessages(messages, currentRole) {
    // currentRole: 'patient', 'doctor', 'admin'
    const isOutgoing = (role) =>
      (role === 'doctor' || role === 'admin') ? currentRole !== 'patient' : currentRole === 'patient';

    let lastDate = '';
    let lastRole = '';
    let html = '';

    messages.forEach((m, idx) => {
      const dateLabel = _chatDateLabel(m.created_at);
      if (dateLabel !== lastDate) {
        html += `<div class="chat-date-sep my-3">
          <span class="text-[10px] text-slate-600 font-medium px-3 py-1 glass rounded-full border border-white/8">${dateLabel}</span>
        </div>`;
        lastDate = dateLabel;
        lastRole = '';
      }

      const outgoing = isOutgoing(m.sender_role);
      const status   = m.status || 'sent';
      const time     = _chatTime(m.created_at);
      const isDoc    = m.sender_role === 'doctor' || m.sender_role === 'admin';
      // Collapse consecutive bubbles from same role
      const sameAsPrev = m.sender_role === lastRole;
      lastRole = m.sender_role;

      if (outgoing) {
        html += `<div class="flex justify-end ${sameAsPrev ? 'mt-0.5' : 'mt-2'}">
          <div class="msg-out px-4 py-2.5">
            <div class="text-sm leading-relaxed">${escapeHtml(m.message)}</div>
            <div class="flex items-center justify-end gap-1 mt-1.5">
              <span class="text-[10px] text-white/50">${time}</span>
              ${_chatStatusHTML(status)}
            </div>
          </div>
        </div>`;
      } else {
        const avatarHtml = sameAsPrev
          ? `<div class="w-7 flex-shrink-0"></div>`
          : `<div class="w-7 h-7 rounded-full ${isDoc ? 'bg-gradient-to-br from-brand-600 to-brand-700' : 'bg-white/10'} flex items-center justify-center flex-shrink-0 self-end">
               <i class="fas ${isDoc ? 'fa-user-md' : 'fa-user'} text-white text-[10px]"></i>
             </div>`;
        const senderBadge = (!sameAsPrev && isDoc)
          ? `<span class="text-[10px] text-brand-400 font-semibold block mb-1">Doctor</span>`
          : (!sameAsPrev && !isDoc)
            ? `<span class="text-[10px] text-slate-500 font-medium block mb-1">Patient</span>`
            : '';
        html += `<div class="flex items-end gap-2 ${sameAsPrev ? 'mt-0.5' : 'mt-2'}">
          ${avatarHtml}
          <div class="msg-in px-4 py-2.5">
            ${senderBadge}
            <div class="text-sm leading-relaxed">${escapeHtml(m.message)}</div>
            <div class="text-[10px] text-slate-600 mt-1.5">${time}</div>
          </div>
        </div>`;
      }
    });
    return html;
  }

  // Local alias for the Supabase client
  const sbClient = window.sbClient;

  // ===========================
  // DOCTOR PHOTO UPLOAD HELPERS
  // ===========================
  window.previewDocPhoto = function(inputId, previewId, iconId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const icon = document.getElementById(iconId);
    const nameEl = document.getElementById(inputId + 'Name') || document.getElementById(inputId.replace('Photo','PhotoName'));
    const file = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover" alt="Preview" />`;
      if (nameEl) nameEl.textContent = file.name.length > 28 ? file.name.slice(0,25)+'...' : file.name;
    };
    reader.readAsDataURL(file);
  };

  async function uploadDoctorPhoto(file, email) {
    // Sanitize email for use as filename path
    const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${safeEmail}_${Date.now()}.${ext}`;
    const { error } = await sbClient.storage
      .from('doctor-photos')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: urlData } = sbClient.storage.from('doctor-photos').getPublicUrl(path);
    return urlData.publicUrl;
  }

  // ===========================
  // ROLES (loaded dynamically from doctor_profiles)
  // ===========================
  const ADMIN_EMAILS = ['faressallam90@gmail.com'];
  let _doctorProfilesCache = [];
  function isAdmin(email)  { return ADMIN_EMAILS.includes((email || '').toLowerCase().trim()); }
  function isDoctor(email) {
    const e = (email||'').toLowerCase().trim();
    return !isAdmin(e) && _doctorProfilesCache.some(d => d.email && d.email.toLowerCase()===e);
  }
  async function loadDoctorProfiles() {
    try {
      const { data, error } = await sbClient.from('doctor_profiles').select('*').eq('is_active', true);
      if (error) {
        // Most commonly an RLS policy blocking public SELECT on doctor_profiles
        console.error('loadDoctorProfiles SELECT error (check RLS on doctor_profiles):', error.message);
      }
      if (data && data.length) {
        _doctorProfilesCache = data;
        // Re-render public doctors section from cache without a second Supabase call
        _resetUsedPhotos();
        doctors = data.map(mapDoctorProfile);
        renderDoctors('all');
        updateBookingDoctorDropdown();
        return;
      }
    } catch(err){ console.warn('loadDoctorProfiles:', err); }
    // Fallback for when Supabase is unavailable
    if (!_doctorProfilesCache.length) {
      _doctorProfilesCache = fallbackDoctorProfiles;
    }
  }
  function getMyDoctorProfile(email) {
    return _doctorProfilesCache.find(d => d.email && d.email.toLowerCase()===(email||'').toLowerCase());
  }

  // ===========================
  // AUTH STATE
  // ===========================
  let currentUser = null;

  async function initAuth() {
    await loadDoctorProfiles();
    // Always listen for real auth changes
    sbClient.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        currentUser = session.user; onAuthSuccess(session.user);
      } else if (event === 'SIGNED_OUT') {
        currentUser = null; onAuthLogout();
      }
    });
    try {
      const { data: { session } } = await sbClient.auth.getSession();
      if (session?.user) { currentUser = session.user; onAuthSuccess(session.user); return; }
    } catch(_) { /* Supabase unavailable, check demo session below */ }
    // Fallback: restore demo session from localStorage
    const saved = localStorage.getItem('scp_demo_session');
    if (saved) {
      try {
        const demoUser = JSON.parse(saved);
        currentUser = demoUser;
        onAuthSuccess(demoUser);
        return;
      } catch(_) { localStorage.removeItem('scp_demo_session'); }
    }
    onAuthLogout();
  }

  function showInlineDashboard(role, email) {
    const bookingSection = document.getElementById('booking');
    const dashSection    = document.getElementById('inlineDashboardSection');
    const adminDash      = document.getElementById('inlineAdminDash');
    const docDash        = document.getElementById('inlineDoctorDash');
    if (role === 'Admin' || role === 'Doctor') {
      if (bookingSection) bookingSection.style.display = 'none';
      if (dashSection) dashSection.classList.remove('hidden');
      if (role === 'Admin') {
        if (adminDash) adminDash.classList.remove('hidden');
        if (docDash) docDash.classList.add('hidden');
        loadInlineAdminStats();
        loadInlineAdminAppts();
        loadInlineAdminDoctors();
      } else {
        if (docDash) docDash.classList.remove('hidden');
        if (adminDash) adminDash.classList.add('hidden');
        _iDocStatusFilter = 'pending';
        _iDocChatApptId = null;
        _iDocSearchQuery = '';
        _iDocDateFilterVal = 'all';
        loadInlineDocStats();
        loadInlineDocAppts();
        loadInlineDocChatTabs();
      }
      // Auto-scroll to dashboard for admin/doctor
      setTimeout(() => {
        if (dashSection) dashSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    } else {
      if (bookingSection) bookingSection.style.display = '';
      if (dashSection) dashSection.classList.add('hidden');
    }
  }

  function hideInlineDashboard() {
    const bookingSection = document.getElementById('booking');
    const dashSection    = document.getElementById('inlineDashboardSection');
    if (bookingSection) bookingSection.style.display = '';
    if (dashSection) dashSection.classList.add('hidden');
  }

  function onAuthSuccess(user) {
    const email  = user.email || '';
    const meta   = user.user_metadata || {};
    const name   = meta.full_name || meta.name || email.split('@')[0];
    const doctor = isDoctor(email);
    const admin  = isAdmin(email);
    const role   = admin ? 'Admin' : doctor ? 'Doctor' : 'Patient';
    document.getElementById('navAuthBtns').style.display = 'none';
    const chip = document.getElementById('navUserChip');
    chip.style.display = 'flex';
    // Show quick logout only for admin/doctor
    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) logoutBtn.style.display = (admin || doctor) ? 'flex' : 'none';
    document.getElementById('navUserName').textContent = name;
    const badge = document.getElementById('navUserBadge');
    badge.textContent = role;
    badge.className = admin
      ? 'text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300'
      : doctor
        ? 'text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300'
        : 'text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-300';
    badge.classList.remove('hidden');
    document.getElementById('mobileAuthBtns').classList.add('hidden');
    document.getElementById('mobileUserRow').classList.remove('hidden');
    document.getElementById('mobileUserName').textContent = name;
    const be = document.getElementById('bookingEmail');
    if (be && email) { 
      be.value = email.toLowerCase().trim(); 
      be.setAttribute('readonly', 'true'); 
      be.classList.add('bg-dark-900/50', 'text-slate-400', 'cursor-not-allowed');
    }
    showInlineDashboard(role, email);
    const pn = document.getElementById('patientDashName');
    if (pn) pn.textContent = name;
    const pe = document.getElementById('patientDashEmail');
    if (pe) pe.textContent = email;
    if (window.refreshChatBadge) refreshChatBadge();   // show unread doctor replies on the floating icon
  }

  function onAuthLogout() {
    currentUser = null;
    localStorage.removeItem('scp_demo_session');
    document.getElementById('navAuthBtns').style.display = '';
    const chip = document.getElementById('navUserChip');
    chip.style.display = 'none';
    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) logoutBtn.style.display = 'none';
    document.getElementById('mobileAuthBtns').classList.remove('hidden');
    document.getElementById('mobileUserRow').classList.add('hidden');
    const be = document.getElementById('bookingEmail');
    if (be) { 
      be.value = ''; 
      be.removeAttribute('readonly'); 
      be.classList.remove('bg-dark-900/50', 'text-slate-400', 'cursor-not-allowed'); 
    }
    hideInlineDashboard();
    const _cb = document.getElementById('chatBadge'); if (_cb) _cb.classList.add('hidden');
    _floatChatActive = null; _floatChatGroups = [];
  }

  window.openUserDashboard = function() {
    if (!currentUser) return;
    if (isAdmin(currentUser.email) || isDoctor(currentUser.email)) {
      document.getElementById('inlineDashboardSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      openModal('patientDashboard');
    }
  };

  window.handleLogout = async function() {
    try { await sbClient.auth.signOut(); } catch(_) {}
    localStorage.removeItem('scp_demo_session');
    onAuthLogout();
    showToast('You have been logged out.', 'info');
  };

  // ===========================
  // FORGOT PASSWORD
  // ===========================
  let _fpEmailPending = '';
  window.fpSendCode = async function(e) {
    e.preventDefault();
    const email = document.getElementById('fpEmail').value.trim();
    const errEl = document.getElementById('fpError'); errEl.classList.add('hidden');
    const btn = document.getElementById('fpSendBtn'); btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Sending...';
    try {
      // Sends the "Reset password" email template (with {{ .Token }} = 6-digit code)
      const { error } = await sbClient.auth.resetPasswordForEmail(email);
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes('not found')||m.includes('invalid')||error.status===422||error.status===400) {
          document.getElementById('fpErrorMsg').textContent='This email is not registered. Please create an account first.';
          errEl.classList.remove('hidden'); return;
        }
        throw error;
      }
      _fpEmailPending=email;
      document.getElementById('fpStep1Form').classList.add('hidden');
      document.getElementById('fpStep2Form').classList.remove('hidden');
      document.getElementById('fpEmailDisplay').textContent=email;
      const d1=document.getElementById('fp-step1-dot'); d1.className='w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-green-500 text-white'; d1.innerHTML='<i class="fas fa-check text-[10px]"></i>';
      document.getElementById('fp-step2-dot').className='w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-brand-600 text-white';
      document.getElementById('fp-step-label').textContent='Enter code & new password';
    } catch(err2) { document.getElementById('fpErrorMsg').textContent=err2.message; errEl.classList.remove('hidden'); }
    finally { btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Send Verification Code'; }
  };
  window.fpVerifyAndReset = async function(e) {
    e.preventDefault();
    const code=document.getElementById('fpCode').value.trim(), newPass=document.getElementById('fpNewPass').value;
    const errEl=document.getElementById('fpError'); errEl.classList.add('hidden');
    if (!/^\d{6}$/.test(code)) { document.getElementById('fpErrorMsg').textContent='Please enter the 6-digit code from your email.'; errEl.classList.remove('hidden'); return; }
    if ((newPass||'').length < 6) { document.getElementById('fpErrorMsg').textContent='New password must be at least 6 characters.'; errEl.classList.remove('hidden'); return; }
    const btn=document.getElementById('fpResetBtn'); btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Resetting...';
    try {
      const{error:vE}=await sbClient.auth.verifyOtp({email:_fpEmailPending,token:code,type:'recovery'}); if(vE)throw vE;
      const{error:uE}=await sbClient.auth.updateUser({password:newPass}); if(uE)throw uE;
      closeModal('forgotPassModal'); resetForgotPass(); showToast('Password reset successfully!','success');
    } catch(err3) { document.getElementById('fpErrorMsg').textContent=err3.message.includes('expired')||err3.message.includes('invalid')?'Code expired or invalid. Request a new code.':err3.message; errEl.classList.remove('hidden'); }
    finally { btn.disabled=false; btn.innerHTML='<i class="fas fa-lock"></i> Reset Password'; }
  };
  window.resetForgotStep=function(){
    document.getElementById('fpStep1Form').classList.remove('hidden'); document.getElementById('fpStep2Form').classList.add('hidden');
    const d1=document.getElementById('fp-step1-dot'); d1.className='w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-brand-600 text-white'; d1.textContent='1';
    document.getElementById('fp-step2-dot').className='w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-white/10 text-slate-500';
    document.getElementById('fp-step-label').textContent='Enter your email';
    document.getElementById('fpError').classList.add('hidden');
  };
  window.resetForgotPass=function(){ resetForgotStep(); ['fpEmail','fpCode','fpNewPass'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';}); _fpEmailPending=''; };

  // Demo accounts for offline / Supabase-unavailable fallback
  const DEMO_ACCOUNTS = {
    'admin@smartclinicpro.com':   { password: 'admin123',   role: 'Admin',  name: 'Admin' },
    'faressallam90@gmail.com':    { password: 'admin123',   role: 'Admin',  name: 'Fares' },
    'sarah.mitchell@smartclinicpro.com':  { password: 'doctor123', role: 'Doctor', name: 'Dr. Sarah Mitchell' },
    'michael.osei@smartclinicpro.com':    { password: 'doctor123', role: 'Doctor', name: 'Dr. Michael Osei' },
    'james.patel@smartclinicpro.com':     { password: 'doctor123', role: 'Doctor', name: 'Dr. James Patel' },
    'aisha.rahman@smartclinicpro.com':    { password: 'doctor123', role: 'Doctor', name: 'Dr. Aisha Rahman' },
    'elena.volkov@smartclinicpro.com':    { password: 'doctor123', role: 'Doctor', name: 'Dr. Elena Volkov' },
    'robert.chen@smartclinicpro.com':     { password: 'doctor123', role: 'Doctor', name: 'Dr. Robert Chen' },
    'patient@test.com':           { password: 'patient123', role: 'Patient', name: 'Patient' },
  };
  function _isSupabaseUnavailable(err) {
    const m = (err?.message || err?.error_description || '').toLowerCase();
    return m.includes('unavailable') || m.includes('timeout') || m.includes('network') || m.includes('fetch') || m.includes('failed');
  }
  function _demoLogin(email, password) {
    const key = email.toLowerCase().trim();
    const acct = DEMO_ACCOUNTS[key];
    if (!acct || acct.password !== password) return null;
    return {
      email: key,
      user_metadata: { full_name: acct.name },
      role: acct.role,
    };
  }

  // ===========================
  // LOGIN (Supabase Auth + demo fallback)
  // ===========================
  window.handleLogin = async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;
    const btn = document.getElementById('loginSubmitBtn');
    const errEl = document.getElementById('loginError');
    errEl.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    try {
      const { error } = await sbClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      closeModal('loginModal');
      document.getElementById('loginForm').reset();
      showToast('Welcome back! Signed in successfully.', 'success');
    } catch (err) {
      // Check doctor_profiles for admin-assigned password
      try {
        const { data: docProfile } = await sbClient
          .from('doctor_profiles')
          .select('email, display_name, specialty, doctor_password, is_active, permissions')
          .eq('email', email)
          .eq('is_active', true)
          .single();

        if (docProfile && docProfile.doctor_password && docProfile.doctor_password === password) {
          const sessionUser = {
            email: email.toLowerCase().trim(),
            user_metadata: { full_name: docProfile.display_name },
            role: 'Doctor',
          };
          localStorage.setItem('scp_demo_session', JSON.stringify(sessionUser));
          currentUser = sessionUser;
          onAuthSuccess(sessionUser);
          closeModal('loginModal');
          document.getElementById('loginForm').reset();
          showToast('Welcome back, ' + docProfile.display_name + '!', 'success');
          return;
        }
      } catch (_) { /* Supabase unreachable — fall through to demo */ }

      // Fallback: demo accounts
      const demoUser = _demoLogin(email, password);
      if (demoUser && (_isSupabaseUnavailable(err) || err.message.includes('Invalid login credentials'))) {
        closeModal('loginModal');
        document.getElementById('loginForm').reset();
        localStorage.setItem('scp_demo_session', JSON.stringify(demoUser));
        currentUser = demoUser;
        onAuthSuccess(demoUser);
        showToast('Welcome back! Signed in (offline mode).', 'success');
      } else {
        document.getElementById('loginErrorMsg').textContent =
          err.message.includes('Invalid login credentials')
            ? 'Incorrect email or password. Please try again.'
            : err.message;
        errEl.classList.remove('hidden');
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
  };

  // ===========================
  // SIGNUP (Supabase signUp with email verification)
  // ===========================

  let _suEmailPending = '';

  window.signupSendOtp = async function(e) {
    e.preventDefault();
    const firstName = document.getElementById('suFirstName').value.trim();
    const lastName  = document.getElementById('suLastName').value.trim();
    const email     = document.getElementById('suEmail').value.trim();
    const password  = document.getElementById('suPass').value;
    const errEl = document.getElementById('signupError');
    errEl.classList.add('hidden');

    if (password.length < 6) {
      document.getElementById('signupErrorMsg').textContent = 'Password must be at least 6 characters.';
      errEl.classList.remove('hidden');
      return;
    }

    // Block doctor emails from self-registering
    if (isDoctor(email)) {
      document.getElementById('signupErrorMsg').textContent = 'Doctor accounts are pre-assigned by administration. Contact admin@smartclinicpro.com for access.';
      errEl.classList.remove('hidden');
      return;
    }

    const btn = document.getElementById('suSendOtpBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    try {
      const { error } = await sbClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: `${firstName} ${lastName}`.trim() },
          emailRedirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) throw error;
      _suEmailPending = email;
      document.getElementById('signupStep1Form').classList.add('hidden');
      document.getElementById('signupStep2Form').classList.remove('hidden');
      document.getElementById('suEmailDisplay').textContent = email;
      document.getElementById('su-step1-dot').className = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-green-500 text-white';
      document.getElementById('su-step1-dot').innerHTML = '<i class="fas fa-check text-[10px]"></i>';
      document.getElementById('su-step2-dot').className = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-brand-600 text-white';
      document.getElementById('su-step-label').textContent = 'Verify your email';
      showToast('Account created! Enter the 6-digit code sent to your email.', 'success');
    } catch (err) {
      document.getElementById('signupErrorMsg').textContent = err.message.includes('User already registered')
        ? 'An account with this email already exists. Please sign in.'
        : err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
  };

  window.signupVerifyOtp = async function(e) {
    e.preventDefault();
    const email = (_suEmailPending || document.getElementById('suEmail')?.value || '').trim();
    const code  = (document.getElementById('suOtp')?.value || '').trim();
    const errEl = document.getElementById('signupError');
    errEl.classList.add('hidden');

    if (!/^\d{6}$/.test(code)) {
      document.getElementById('signupErrorMsg').textContent = 'Please enter the 6-digit code sent to your email.';
      errEl.classList.remove('hidden');
      return;
    }

    const btn = document.getElementById('suVerifyBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    try {
      // Verify the signup confirmation code (Supabase emails {{ .Token }} as a 6-digit OTP)
      const { error } = await sbClient.auth.verifyOtp({ email, token: code, type: 'signup' });
      if (error) throw error;
      closeModal('signupModal');
      resetSignupForm();
      showToast('Email verified! Welcome to Smart Clinic Pro.', 'success');
      // onAuthStateChange (SIGNED_IN) handles the logged-in UI automatically
    } catch (err) {
      const m = (err.message || '').toLowerCase();
      document.getElementById('signupErrorMsg').textContent =
        (m.includes('expired') || m.includes('invalid') || m.includes('token'))
          ? 'Code expired or invalid. Please check the code and try again.'
          : err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
  };

  window.resetSignupStep = function() {
    document.getElementById('signupStep1Form').classList.remove('hidden');
    document.getElementById('signupStep2Form').classList.add('hidden');
    document.getElementById('su-step1-dot').className = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-brand-600 text-white';
    document.getElementById('su-step1-dot').textContent = '1';
    document.getElementById('su-step2-dot').className = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-white/10 text-slate-500';
    document.getElementById('su-step-label').textContent = 'Your details';
    document.getElementById('signupError').classList.add('hidden');
  };

  window.resetSignupForm = function() {
    resetSignupStep();
    _suEmailPending = '';
    ['suFirstName','suLastName','suEmail','suPass','suOtp'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const a = document.getElementById('suAgree'); if (a) a.checked = false;
  };

  window.togglePass = function(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  // ===========================
  // BOOKING (Supabase)
  // ===========================
  function isMissingColumnError(error, column) {
    const msg = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
    return msg.includes(column.toLowerCase()) && (msg.includes('column') || msg.includes('schema cache'));
  }

  function showBookingError(msg) {
    const errEl = document.getElementById('bookingError');
    const msgEl = document.getElementById('bookingErrorMsg');
    if (errEl && msgEl) {
      msgEl.textContent = msg;
      errEl.classList.remove('hidden');
    }
  }

  function hideBookingError() {
    const errEl = document.getElementById('bookingError');
    if (errEl) errEl.classList.add('hidden');
  }

  function validateBookingForm(name, age, gender, specialty, date, phone) {
    if (!name || name.trim().length < 2) return 'Please enter a valid full name.';
    if (!age || age < 1 || age > 120) return 'Please enter a valid age (1–120).';
    if (!gender) return 'Please select a gender.';
    if (!specialty) return 'Please select a specialty.';
    if (date) {
      const selected = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) return 'Please select a future date.';
    }
    if (phone) {
      const phoneClean = phone.replace(/[\s\-\(\)\+]/g, '');
      if (!/^\d{7,15}$/.test(phoneClean)) return 'Please enter a valid phone number.';
    }
    return null;
  }

  window.submitBooking = async function(e) {
    e.preventDefault();
    hideBookingError();

    const patientName   = document.getElementById('bookingName')?.value.trim() || '';
    const patientAge    = parseInt(document.getElementById('bookingAge')?.value) || null;
    const patientGender = document.getElementById('bookingGender')?.value || '';
    const specialty     = document.getElementById('bookingSpecialty')?.value || '';
    const preferredDate = document.getElementById('bookingDate')?.value || null;
    const phone         = document.getElementById('bookingPhone')?.value.trim() || null;
    const emailForm     = (document.getElementById('bookingEmail')?.value || '').trim();
    // If the user is logged in, ALWAYS use their account email to ensure appointments appear in their dashboard
    const patientEmail  = currentUser?.email ? currentUser.email.toLowerCase().trim() : (emailForm ? emailForm.toLowerCase() : null);
    const notes         = document.getElementById('bookingNotes')?.value.trim() || '';
    const form          = document.getElementById('bookingForm');
    const submitBtn     = form?.querySelector('button[type="submit"]');

    const doctorName    = document.getElementById('bookingDoctor')?.value || null;
    const paymentMethod = getSelectedPayMethod();

    const validationError = validateBookingForm(patientName, patientAge, patientGender, specialty, preferredDate, phone);
    if (validationError) {
      showBookingError(validationError);
      return;
    }

    if (!patientEmail) {
      showBookingError('Failed, Please log in Your Email.');
      return;
    }

    const originalHtml = submitBtn?.innerHTML || '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...'; }

    try {
      const appointmentPayload = {
        patient_name:   patientName,
        patient_age:    patientAge,
        patient_gender: patientGender,
        specialty,
        preferred_date: preferredDate,
        phone:          phone || null,
        patient_email:  patientEmail,
        notes:          notes || null,
        doctor_name:    doctorName,
        status:         'pending',
        payment_method: paymentMethod,
      };

      let { data, error } = await sbClient
        .from('appointments')
        .insert([appointmentPayload])
        .select()
        .single();

      if (error && isMissingColumnError(error, 'payment_method')) {
        delete appointmentPayload.payment_method;
        ({ data, error } = await sbClient
          .from('appointments')
          .insert([appointmentPayload])
          .select()
          .single());
      }

      if (error) throw error;

      // Notify assigned doctor of new booking (fire-and-forget)
      if (data?.id) {
        sbClient.functions.invoke('notify-appointment', { body: { appointmentId: data.id, action: 'new_booking' } })
          .then(() => {
            // success: edge function notified
          })
          .catch(async (err) => {
            console.warn('notify-appointment failed, falling back to DB notification:', err);
            try {
              await sbClient.from('notifications').insert({ appointment_id: data.id, action: 'new_booking', status: 'pending' });
            } catch (fbErr) {
              console.error('Fallback notification insert failed:', fbErr);
            }
          });
      }

      form.reset();
      openModal('bookingSuccessModal');
      // Offer a direct chat with the chosen doctor right after booking
      const _scBtn = document.getElementById('bookingSuccessChatBtn');
      if (_scBtn) {
        if (doctorName && data?.id) {
          _scBtn.classList.remove('hidden');
          _scBtn.onclick = () => openChatForAppt(data.id, doctorName, specialty);
        } else {
          _scBtn.classList.add('hidden');
        }
      }
      showToast('Appointment submitted successfully!', 'success');

    } catch (err) {
      console.error('Booking error:', err);
      const errMsg = (err.message || '').toLowerCase();
      const displayMsg = errMsg.includes('row-level security') || errMsg.includes('rls') || errMsg.includes('policy')
        ? 'Booking is temporarily unavailable. Please contact the clinic or try again later.'
        : (err.message || 'Booking failed. Please try again.');
      showBookingError(displayMsg);
      showToast('Booking failed. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  };

  // ===========================
  // PATIENT TAB SWITCHING
  // ===========================
  window.switchPatientTab = function(tab) {
    ['overview', 'appointments', 'chat'].forEach(t => {
      document.getElementById('patientTab-' + t).classList.toggle('hidden', t !== tab);
      const btn = document.getElementById('tab-' + t);
      if (btn) {
        if (t === tab) {
          btn.classList.add('bg-brand-600', 'text-white', 'shadow');
          btn.classList.remove('text-slate-400');
        } else {
          btn.classList.remove('bg-brand-600', 'text-white', 'shadow');
          btn.classList.add('text-slate-400');
        }
      }
    });
    if (tab === 'appointments') fetchPatientAppointments();
    if (tab === 'chat') loadPatientChat();
  };

  // Patient chat functions
  let _patientChatApptId = null;

  async function loadPatientChat() {
    const container = document.getElementById('patientChatMessages');
    if (!container) return;
    const email = currentUser?.email?.toLowerCase().trim();
    if (!email) {
      container.innerHTML = '<div class="text-center py-10 text-slate-500 text-sm">Sign in to view your messages.</div>';
      return;
    }
    container.innerHTML = '<div class="flex items-center justify-center py-6 gap-2 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading messages...</span></div>';

    // Get latest appointment for this patient
    try {
      const { data: appts } = await sbClient
        .from('appointments')
        .select('id')
        .eq('patient_email', email)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!appts || appts.length === 0) {
        container.innerHTML = '<div class="text-center py-10"><div class="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-comments text-brand-400 text-xl"></i></div><p class="text-sm text-slate-400">No messages yet</p><p class="text-xs text-slate-600 mt-1">Book an appointment to start chatting with your doctor</p></div>';
        return;
      }

      _patientChatApptId = appts[0].id;
      const messages = await loadChatMessages(appts[0].id);

      if (messages.length === 0) {
        container.innerHTML = '<div class="text-center py-10"><div class="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-comment-dots text-brand-400 text-xl"></i></div><p class="text-sm text-slate-400">No messages yet</p><p class="text-xs text-slate-600 mt-1">Send a message to your doctor</p></div>';
        return;
      }

      container.innerHTML = _renderChatMessages(messages, 'patient');
      container.scrollTop = container.scrollHeight;

    } catch (err) {
      container.innerHTML = `<div class="text-center py-6 text-red-400 text-sm"><i class="fas fa-exclamation-circle mr-1"></i>${escapeHtml(err.message)}</div>`;
    }
  }

  window.sendPatientChat = async function() {
    const input = document.getElementById('patientChatInput');
    const msg = input.value.trim();
    if (!msg || !_patientChatApptId) return;
    const container = document.getElementById('patientChatMessages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    container.innerHTML += `<div class="flex justify-end mt-2"><div class="msg-out px-4 py-2.5"><div class="text-sm leading-relaxed">${escapeHtml(msg)}</div><div class="flex items-center justify-end gap-1 mt-1.5"><span class="text-[10px] text-white/50">${time}</span><i class="fas fa-circle-notch fa-spin text-[9px] text-white/40 ml-0.5"></i></div></div></div>`;
    input.value = '';
    container.scrollTop = container.scrollHeight;

    const saved = await sendChatMessageToDB(_patientChatApptId, currentUser.email, 'patient', msg);
    const lastMsg = container.querySelector('.flex.justify-end:last-child .fa-circle-notch');
    if (lastMsg) {
      lastMsg.className = saved ? 'fas fa-check text-[9px] text-slate-400' : 'fas fa-times text-[9px] text-red-400';
    }
    if (!saved) {
      container.innerHTML += `<div class="text-center py-2 text-red-400 text-xs">Failed to save message</div>`;
    }
  };

  async function fetchPatientAppointments() {
    const email = currentUser?.email?.toLowerCase().trim();
    const container = document.getElementById('myAppointmentsList');
    if (!container) return;
    if (!email) { container.innerHTML = '<p class="text-sm text-slate-500 text-center py-6">Sign in to view your appointments.</p>'; return; }
    container.innerHTML = '<div class="flex items-center justify-center py-8 gap-3 text-slate-400"><i class="fas fa-spinner fa-spin text-brand-400"></i><span class="text-sm">Loading...</span></div>';
    try {
      const { data, error } = await sbClient.from('appointments').select('*').eq('patient_email', email).order('created_at', { ascending: false });
      if (error) throw error;
      const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
      setEl('patientTotalAppts', data?.length || 0);
      setEl('patientApprovedAppts', data?.filter(a => a.status === 'approved').length || 0);
      setEl('patientPendingAppts', data?.filter(a => a.status === 'pending').length || 0);
      if (!data || data.length === 0) {
        container.innerHTML = '<div class="text-center py-10"><div class="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3"><i class="fas fa-calendar text-brand-400 text-xl"></i></div><p class="text-sm text-slate-400">No appointments found for ' + escapeHtml(email) + '</p><p class="text-xs text-slate-600 mt-1">Please ensure you use the same email during booking</p></div>';
        return;
      }
      const sCls  = { pending:'bg-gold-500/15 border-gold-500/30 text-gold-300', approved:'bg-green-500/15 border-green-500/30 text-green-300', postponed:'bg-blue-500/15 border-blue-500/30 text-blue-300', cancelled:'bg-red-500/15 border-red-500/30 text-red-300', completed:'bg-purple-500/15 border-purple-500/30 text-purple-300' };
      const sIcon = { pending:'fa-clock', approved:'fa-check-circle', postponed:'fa-redo', cancelled:'fa-times-circle', completed:'fa-star' };
      const sBar  = { pending:'#f59e0b', approved:'#22c55e', postponed:'#3b82f6', cancelled:'#ef4444', completed:'#a855f7' };

      const rows = data.map(a => {
        const s       = safeStatus(a.status);
        const pm      = safePaymentMethod(a.payment_method);
        const dt      = a.preferred_date ? new Date(a.preferred_date + 'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}) : 'Date TBD';
        const created = new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
        const badge   = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${sCls[s]||sCls.pending}"><i class="fas ${sIcon[s]||'fa-circle'} text-[10px]"></i>${capitalize(s)}</span>`;

        return `<div class="rounded-2xl overflow-hidden mb-3 cursor-pointer hover:scale-[1.01] transition-all group" onclick="openPatientApptDetail(${jsArg(JSON.stringify(a))})">
          <div style="height:3px;background:${sBar[s]||'#6b7280'}"></div>
          <div class="glass border border-white/8 border-t-0 rounded-b-2xl p-4">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-2xl bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="fas fa-stethoscope text-brand-400"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span class="text-sm font-extrabold text-white capitalize">${escapeHtml(capitalize(a.specialty||'—'))}</span>
                  ${badge}
                </div>
                <div class="space-y-1 text-xs text-slate-500">
                  <div class="flex items-center gap-1.5"><i class="fas fa-user-md text-brand-400/60 w-3"></i>${escapeHtml(a.doctor_name||'TBD')}</div>
                  <div class="flex items-center gap-1.5"><i class="fas fa-calendar text-brand-400/60 w-3"></i>${escapeHtml(dt)}</div>
                  <div class="flex items-center gap-1.5 text-slate-600"><i class="fas fa-clock w-3"></i>Booked ${escapeHtml(created)}</div>
                </div>
                ${a.notes ? `<div class="mt-2 text-xs text-slate-400 bg-white/3 border border-white/5 rounded-xl px-3 py-1.5 line-clamp-1"><i class="fas fa-comment-medical mr-1 text-brand-400/50"></i>${escapeHtml(a.notes)}</div>` : ''}
              </div>
              <div class="flex-shrink-0 text-slate-600 group-hover:text-brand-400 transition-colors mt-1">
                <i class="fas fa-chevron-right text-xs"></i>
              </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span class="text-[10px] text-slate-600 flex items-center gap-1">
                <i class="fas fa-${pm==='cash'?'money-bill-wave':'credit-card'} text-brand-400/40"></i>
                ${pm === 'cash' ? 'Cash' : 'Visa/MC'}
                ${s === 'completed' ? '<i class="fas fa-check-circle text-green-400 ml-1"></i> Paid' : ''}
              </span>
              <span class="text-[10px] text-brand-400 font-semibold group-hover:underline">View Details →</span>
            </div>
          </div>
        </div>`;
      });
      container.innerHTML = rows.join('');
    } catch (err) {
      container.innerHTML = '<div class="flex items-center gap-2 text-red-400 text-sm p-4 glass border border-red-500/20 rounded-xl"><i class="fas fa-exclamation-circle"></i><span>' + escapeHtml(err.message) + '</span></div>';
    }
  }

  window.openPatientApptDetail = function(apptJson) {
    const a  = typeof apptJson === 'string' ? JSON.parse(apptJson) : apptJson;
    const s  = safeStatus(a.status);
    const pm = safePaymentMethod(a.payment_method);

    // Status config
    const sc = {
      pending:   { bg:'linear-gradient(135deg,rgba(120,53,15,.6),rgba(92,45,12,.4))',   color:'#f59e0b', label:'PENDING',   icon:'fa-clock' },
      approved:  { bg:'linear-gradient(135deg,rgba(20,83,45,.6),rgba(21,128,61,.4))',   color:'#22c55e', label:'APPROVED',  icon:'fa-check-circle' },
      postponed: { bg:'linear-gradient(135deg,rgba(30,58,138,.6),rgba(29,78,216,.4))',  color:'#3b82f6', label:'POSTPONED', icon:'fa-redo' },
      cancelled: { bg:'linear-gradient(135deg,rgba(127,29,29,.6),rgba(185,28,28,.4))',  color:'#ef4444', label:'CANCELLED', icon:'fa-times-circle' },
      completed: { bg:'linear-gradient(135deg,rgba(88,28,135,.6),rgba(126,34,206,.4))', color:'#a855f7', label:'COMPLETED', icon:'fa-star' },
    }[s] || { bg:'linear-gradient(135deg,rgba(14,135,160,.4),rgba(11,105,125,.3))', color:'#14a8c0', label:s.toUpperCase(), icon:'fa-circle' };

    // Header
    const headerEl = document.getElementById('padHeader');
    if (headerEl) headerEl.style.background = sc.bg;
    const badgeEl = document.getElementById('padStatusBadge');
    if (badgeEl) badgeEl.innerHTML = `<i class="fas ${sc.icon} text-[10px]"></i>${sc.label}`;

    const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val || '—'; };

    // Booked at
    const created = a.created_at ? new Date(a.created_at).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) : '';
    setEl('padBookedAt', created ? 'Booked on ' + created : '');

    // Date
    const dateEl  = document.getElementById('padDate');
    const dateBox = document.getElementById('padDateBox');
    if (a.preferred_date) {
      const ds = new Date(a.preferred_date + 'T12:00:00').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
      if (dateEl)  dateEl.textContent = ds;
      if (dateBox) { dateBox.style.background = 'rgba(20,168,192,0.12)'; dateBox.style.border = '1px solid rgba(20,168,192,0.3)'; }
    } else {
      if (dateEl)  dateEl.textContent = 'No date selected';
      if (dateBox) { dateBox.style.background = 'rgba(255,255,255,0.03)'; dateBox.style.border = '1px solid rgba(255,255,255,0.08)'; }
    }

    // Info
    setEl('padSpecialty', capitalize(a.specialty || ''));
    setEl('padDoctor',    a.doctor_name || 'To be assigned');
    setEl('padAge',       a.patient_age ? a.patient_age + ' years' : '—');
    setEl('padGender',    capitalize(a.patient_gender || ''));
    setEl('padEmail',     a.patient_email);
    setEl('padPhone',     a.phone);

    // Payment
    const pmLabels = { card:'Visa / Mastercard', mir:'Mir Card', apple:'Apple Pay', cash:'Cash at Clinic' };
    const pmIcons  = { card:'fa-credit-card text-blue-400', cash:'fa-money-bill-wave text-green-400', apple:'fa-apple text-slate-300', mir:'fa-credit-card text-green-400' };
    const payEl = document.getElementById('padPayment');
    if (payEl) payEl.innerHTML = `<i class="fas ${pmIcons[pm]||pmIcons.card} mr-1.5"></i>${pmLabels[pm]||'Card'}`;

    // Paid badge
    const paidBadge = document.getElementById('padPaidBadge');
    if (paidBadge) paidBadge.classList.toggle('hidden', s !== 'completed');

    // Notes
    const notesBox = document.getElementById('padNotesBox');
    const notesEl  = document.getElementById('padNotes');
    if (a.notes?.trim()) {
      if (notesBox) notesBox.classList.remove('hidden');
      if (notesEl)  notesEl.textContent = a.notes;
    } else {
      if (notesBox) notesBox.classList.add('hidden');
    }

    // Pay button (show only if approved + not paid yet)
    const payWrap = document.getElementById('padPayBtnWrap');
    const payBtn  = document.getElementById('padPayBtn');
    if (s === 'approved' && pm !== 'cash') {
      if (payWrap) payWrap.classList.remove('hidden');
      if (payBtn)  payBtn.onclick = () => {
        closeModal('patientApptDetailModal');
        payForAppointment(a.id, a.patient_email, a.patient_name, payBtn, pm);
      };
    } else {
      if (payWrap) payWrap.classList.add('hidden');
    }

    openModal('patientApptDetailModal');
  };

  async function fetchPatientStats() {
    const email = currentUser?.email?.toLowerCase().trim();
    if (!email) return;
    try {
      const { data } = await sbClient.from('appointments').select('status').eq('patient_email', email);
      const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
      setEl('patientTotalAppts', data?.length || 0);
      setEl('patientApprovedAppts', data?.filter(a => a.status === 'approved').length || 0);
      setEl('patientPendingAppts', data?.filter(a => a.status === 'pending').length || 0);
    } catch {}
  }


/* ---------- TOAST · TAB STYLES · BOOKING DOCTOR SELECT · PAYMENT UI ---------- */

  // ===========================
  // TOAST
  // ===========================
  function showToast(msg, type = 'info') {
    const colors = { success: 'from-green-600 to-green-700 border-green-500/50', error: 'from-red-600 to-red-700 border-red-500/50', info: 'from-brand-600 to-brand-700 border-brand-500/50', warning: 'from-gold-600 to-gold-700 border-gold-500/50' };
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    const toast = document.createElement('div');
    toast.className = `toast flex items-center gap-3 bg-gradient-to-r ${colors[type]} border rounded-2xl px-5 py-3 shadow-2xl text-white text-sm font-medium`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  // ===========================
  // TAB STYLES
  // ===========================
  function initStyleTabs() {
    // Applied during initSpecialtyTabStyles
  }

  // Intercept openModal to trigger live data fetch
  const _origOpen = window.openModal;
  window.openModal = function(id) {
    _origOpen(id);
    if (id === 'doctorDashboard') { _docStatusFilter='pending'; _docSearchQuery=''; _docDateFilter='all'; const si=document.getElementById('docSearchInput'); if(si)si.value=''; const df=document.getElementById('docDateFilter'); if(df)df.value='all'; fetchAndRenderDocStats(); fetchAndRenderPendingAppts(); loadInlineDocChatTabs(); }
    if (id === 'adminDashboard')  { loadAdminStats(); loadAdminAppts(); loadAdminDoctors(); loadAdminAnalytics(); _adminSearchQuery=''; const si=document.getElementById('adminSearchInput'); if(si)si.value=''; }
    if (id === 'patientDashboard' && currentUser) {
      const meta = currentUser.user_metadata || {};
      const name = meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'Patient';
      const s = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
      s('patientDashName', name); s('patientDashEmail', currentUser.email||'');
      refreshProfileView(meta);
      switchPatientTab('overview');
      fetchPatientStats();
    }
  };

  // ===========================
  // DOCTOR SELECTION / PROFILE / ADMIN / STRIPE
  // ===========================
  window.updateDoctorSelect = function() {
    const spec = document.getElementById('bookingSpecialty')?.value;
    const sel  = document.getElementById('bookingDoctor');
    if (!sel || !spec) return;
    // Filter active doctors by selected specialty from DB cache
    const profileSource = _doctorProfilesCache.length ? _doctorProfilesCache : fallbackDoctorProfiles;
    const filtered = profileSource.filter(d => d.is_active !== false && specKey(d.specialty) === spec);
    if (filtered.length) {
      sel.innerHTML = filtered.map(d =>
        `<option value="${escapeHtml(d.display_name)}">${escapeHtml(d.display_name)} &mdash; ${escapeHtml(d.specialty||'')}</option>`
      ).join('');
    } else {
      // Fallback: show all active doctors
      const all = profileSource.filter(d => d.is_active !== false);
      sel.innerHTML = all.length
        ? all.map(d=>`<option value="${escapeHtml(d.display_name)}">${escapeHtml(d.display_name)} &mdash; ${escapeHtml(d.specialty||'')}</option>`).join('')
        : `<option value="">No doctors available</option>`;
    }
  };

  // Payment method selector UI
  (function initPaymentMethodUI(){
    const group=document.getElementById('paymentMethodGroup');
    const note=document.getElementById('payMethodNote');
    if(!group) return;
    const notes={card:'Secure Visa / Mastercard payment via Stripe after approval.',cash:'Pay in cash at the clinic on the day of your appointment.'};
    group.querySelectorAll('input[name="bookingPayMethod"]').forEach(radio=>{
      radio.addEventListener('change',()=>{
        group.querySelectorAll('.pay-opt-card').forEach(c=>{ c.classList.remove('border-brand-500','bg-brand-500/10'); c.classList.add('border-white/10','bg-white/3'); });
        const card=radio.closest('label').querySelector('.pay-opt-card');
        card.classList.remove('border-white/10','bg-white/3'); card.classList.add('border-brand-500','bg-brand-500/10');
        if(note) note.textContent=notes[radio.value]||notes.card;
      });
    });
  })();

  function getSelectedPayMethod(){const r=document.querySelector('input[name="bookingPayMethod"]:checked');return r?r.value:'card';}


/* ---------- PATIENT PROFILE + STRIPE PAYMENT ---------- */

  window.toggleProfileEdit = function() {
    const view=document.getElementById('profileViewMode'), form=document.getElementById('profileEditMode'), btn=document.getElementById('editProfileToggleBtn');
    if(form.classList.contains('hidden')){
      const meta=currentUser?.user_metadata||{}; const parts=(meta.full_name||meta.name||'').split(' ');
      const g=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;};
      g('profileFirstName',parts[0]||''); g('profileLastName',parts.slice(1).join(' ')||''); g('profilePhone',meta.phone||'');
      const pp=document.getElementById('profileNewPass'); if(pp)pp.value='';
      view.classList.add('hidden'); form.classList.remove('hidden');
      btn.innerHTML='<i class="fas fa-times mr-1"></i>Cancel';
    } else { view.classList.remove('hidden'); form.classList.add('hidden'); btn.innerHTML='<i class="fas fa-pen mr-1"></i>Edit'; }
  };

  window.saveProfile = async function(e) {
    e.preventDefault();
    const btn=document.getElementById('saveProfileBtn');
    const g=(id)=>document.getElementById(id)?.value||'';
    const first=g('profileFirstName').trim(), last=g('profileLastName').trim(), phone=g('profilePhone').trim(), newPass=g('profileNewPass');
    const orig=btn.innerHTML; btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin mr-1"></i>Saving...';
    try {
      const payload={data:{full_name:`${first} ${last}`.trim(),phone}};
      if(newPass&&newPass.length>=6) payload.password=newPass;
      const {error}=await sbClient.auth.updateUser(payload);
      if(error) throw error;
      const name=`${first} ${last}`.trim();
      const s=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
      s('navUserName',name); s('mobileUserName',name); s('patientDashName',name); s('profileViewName',name); s('profileViewPhone',phone||'\u2014');
      toggleProfileEdit(); showToast('Profile updated!','success');
    } catch(err){showToast('Error: '+err.message,'error');}
    finally{btn.disabled=false; btn.innerHTML=orig;}
  };

  function refreshProfileView(meta){
    const email=currentUser?.email||'', name=meta?.full_name||meta?.name||email.split('@')[0], phone=meta?.phone||'\u2014';
    const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    s('profileViewName',name); s('profileViewEmail',email); s('profileViewPhone',phone);
  }

  window.payForAppointment = async function(appointmentId, patientEmail, patientName, btn, payMethod) {
    const method = payMethod || 'card';

    if (method === 'cash') {
      showToast('Cash payment — please pay at the clinic on the day of your appointment.', 'info');
      return;
    }

    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Connecting to Stripe...';

    try {
      const { data, error } = await sbClient.functions.invoke('create-payment', {
        body: { appointmentId, patientEmail, patientName, payMethod: method, origin: window.location.origin },
      });

      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error('No checkout URL received');

      showToast('Redirecting to secure Stripe checkout...', 'info');
      setTimeout(() => { window.location.href = data.url; }, 500);

    } catch (err) {
      console.error('[payment]', err);
      showToast('Payment error: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  };

  // Card number formatter
  window.formatCardNumber = function(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 16);
    input.value = v.replace(/(.{4})/g, '$1 ').trim();
  };

  // Expiry formatter
  window.formatExpiry = function(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0,2) + ' / ' + v.slice(2);
    input.value = v;
  };

  window.submitDemoPayment = async function() {
    const card   = (document.getElementById('dpCard')?.value || '').replace(/\s/g,'');
    const expiry = (document.getElementById('dpExpiry')?.value || '').replace(/\s/g,'');
    const cvc    = (document.getElementById('dpCvc')?.value || '');
    const name   = (document.getElementById('dpName')?.value || '').trim();
    const email  = (document.getElementById('dpEmail')?.value || '').trim();
    const errEl  = document.getElementById('dpError');
    const errMsg = document.getElementById('dpErrorMsg');

    // Validation
    const showErr = (msg) => {
      errMsg.textContent = msg;
      errEl.classList.remove('hidden');
    };

    errEl?.classList.add('hidden');

    if (!email || !email.includes('@'))      return showErr('Please enter a valid email.');
    if (card.length < 16)                    return showErr('Please enter a valid 16-digit card number.');
    if (card === '0000000000000000')         return showErr('Card declined. Please use a different card.');
    if (!expiry || expiry.replace('/','').length < 4) return showErr('Please enter a valid expiry date.');
    if (!cvc || cvc.length < 3)              return showErr('Please enter a valid CVC.');
    if (!name)                               return showErr('Please enter the name on card.');

    // Simulate payment processing
    const payBtn  = document.getElementById('dpPayBtn');
    const btnText = document.getElementById('dpPayBtnText');
    payBtn.disabled = true;
    btnText.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Processing...';

    await new Promise(r => setTimeout(r, 2000)); // Realistic delay

    btnText.innerHTML = '<i class="fas fa-shield-alt mr-1"></i>Verifying...';
    await new Promise(r => setTimeout(r, 800));

    try {
      // Update appointment in Supabase
      const { error } = await sbClient
        .from('appointments')
        .update({ status: 'completed', payment_method: _demoPayMethod || 'card' })
        .eq('id', _demoPayApptId);

      if (error) throw error;

      closeModal('demoPaymentModal');

      // Show payment success modal
      const idEl = document.getElementById('psApptId');
      if (idEl && _demoPayApptId) idEl.textContent = '#' + String(_demoPayApptId).slice(0,8).toUpperCase();
      openModal('paymentSuccessModal');

      // Refresh dashboards
      loadInlineAdminStats();
      loadInlineAdminAppts();

    } catch(err) {
      payBtn.disabled = false;
      btnText.textContent = 'Pay $10.00';
      showErr('Payment failed: ' + err.message);
    }
  };

  // Handle URL params (if ever redirected back)
  function handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment');
    const apptId = params.get('appt');
    if (!status) return;
    window.history.replaceState({}, '', window.location.pathname);
    if (status === 'success') {
      const idEl = document.getElementById('psApptId');
      if (idEl && apptId) idEl.textContent = '#' + apptId.slice(0,8).toUpperCase();
      openModal('paymentSuccessModal');
    } else if (status === 'cancelled') {
      showToast('Payment was cancelled.', 'warning');
    }
  }

  // Admin doctor filter state


/* ---------- BOOTSTRAP (runs after all deferred scripts + DOM ready) ---------- */
document.addEventListener('DOMContentLoaded', function () {
  init();
  handlePaymentReturn();   // Handle Stripe redirect back
  loadDoctorsFromDB();
  initAuth();
});

/* ---------- GLOBAL ERROR / LOAD HANDLERS ---------- */


// Global error handler for uncaught exceptions
window.addEventListener('error', function(e) {
  console.error('Global error:', e.message, e.filename, e.lineno);
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

window.addEventListener('load', function () {
  if (document.getElementById('appLoadFinished')) return;
  const marker = document.createElement('div');
  marker.id = 'appLoadFinished';
  marker.hidden = true;
  document.body.appendChild(marker);
});

