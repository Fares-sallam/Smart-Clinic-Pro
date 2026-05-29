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

document.addEventListener('DOMContentLoaded', function () {

  // ===========================
  // DATA
  // ===========================

  // Doctors loaded dynamically from Supabase doctor_profiles
  let doctors = [];
  const fallbackDoctorProfiles = [
    {
      id: 'fallback-internal-sarah',
      email: 'sarah.mitchell@smartclinicpro.com',
      display_name: 'Dr. Sarah Mitchell',
      specialty: 'Internal Medicine',
      bio: 'Board-certified physician focused on preventive care, chronic disease management, and clear patient communication.',
      photo_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&crop=face',
      is_active: true,
    },
    {
      id: 'fallback-internal-michael',
      email: 'michael.osei@smartclinicpro.com',
      display_name: 'Dr. Michael Osei',
      specialty: 'Internal Medicine',
      bio: 'Experienced internist specializing in diagnostics, adult medicine, and long-term health planning.',
      photo_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
      is_active: true,
    },
    {
      id: 'fallback-dentistry-james',
      email: 'james.patel@smartclinicpro.com',
      display_name: 'Dr. James Patel',
      specialty: 'Dentistry',
      bio: 'Gentle dental specialist offering preventive, restorative, and cosmetic oral care.',
      photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face',
      is_active: true,
    },
    {
      id: 'fallback-dentistry-aisha',
      email: 'aisha.rahman@smartclinicpro.com',
      display_name: 'Dr. Aisha Rahman',
      specialty: 'Dentistry',
      bio: 'Dental care specialist focused on patient comfort, prevention, and long-term oral health.',
      photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
      is_active: true,
    },
    {
      id: 'fallback-ortho-elena',
      email: 'elena.volkov@smartclinicpro.com',
      display_name: 'Dr. Elena Volkov',
      specialty: 'Orthopedics',
      bio: 'Orthopedic specialist focused on joint care, mobility recovery, and sports injury treatment.',
      photo_url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&crop=face',
      is_active: true,
    },
    {
      id: 'fallback-ortho-robert',
      email: 'robert.chen@smartclinicpro.com',
      display_name: 'Dr. Robert Chen',
      specialty: 'Orthopedics',
      bio: 'Orthopedic physician specializing in mobility, injury recovery, and musculoskeletal wellness.',
      photo_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
      is_active: true,
    },
  ];

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

  const testimonials = [
    {
      name: 'Emma Thompson',
      role: 'Patient since 2021',
      img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'Smart Clinic Pro completely transformed my healthcare experience. Dr. Mitchell\'s thorough approach and the seamless online booking made everything so convenient. I cannot recommend this clinic enough!',
    },
    {
      name: 'Carlos Rivera',
      role: 'Patient since 2022',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'After years of dental anxiety, Dr. Patel made me actually look forward to appointments. The modern facility and kind staff create an environment unlike any other clinic I\'ve visited.',
    },
    {
      name: 'Linda Kovacs',
      role: 'Patient since 2020',
      img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'Dr. Volkov performed my knee replacement surgery with incredible precision. The recovery was faster than expected, and the follow-up care through their digital platform is exceptional.',
    },
    {
      name: 'Ahmed Hassan',
      role: 'Patient since 2023',
      img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'The patient portal and chat system are game-changers. Being able to message my doctor between visits and have all my records digitally accessible gives me incredible peace of mind.',
    },
    {
      name: 'Sophia Chen',
      role: 'Patient since 2022',
      img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'I switched to Smart Clinic Pro after years of frustrating healthcare experiences elsewhere. The difference is night and day — from booking to follow-up, everything just works.',
    },
    {
      name: 'Marcus Johnson',
      role: 'Patient since 2021',
      img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'What sets Smart Clinic Pro apart is the genuine care from every staff member. Dr. Osei took time to explain my condition thoroughly, and the digital tools make managing my health effortless.',
    },
    {
      name: 'Fatima Al-Rashid',
      role: 'Patient since 2024',
      img: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'As a newcomer to the country, finding a clinic that truly cares was daunting. Smart Clinic Pro made me feel welcome from day one. Their multilingual staff and seamless digital experience are unmatched.',
    },
    {
      name: 'David Kim',
      role: 'Patient since 2022',
      img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'I have been to many clinics over the years, but none compare to the level of professionalism and care I receive here. The online booking saves me so much time, and the doctors are incredibly thorough.',
    },
    {
      name: 'Maria Gonzalez',
      role: 'Patient since 2023',
      img: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'The pediatric care at Smart Clinic Pro is outstanding. Dr. Rahman was wonderful with my children, explaining everything in a way that put them at ease. The whole family now comes here exclusively.',
    },
    {
      name: 'James Wilson',
      role: 'Patient since 2020',
      img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'After struggling with chronic back pain for years, Dr. Volkov finally gave me a proper diagnosis and treatment plan. The integrated approach — combining physical therapy with digital follow-ups — made all the difference.',
    },
    {
      name: 'Aisha Patel',
      role: 'Patient since 2024',
      img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'I love how easy it is to manage my entire healthcare journey from my phone. From booking appointments to viewing test results and chatting with my doctor, everything is just a few taps away. Truly modern healthcare.',
    },
    {
      name: 'Yuki Tanaka',
      role: 'Patient since 2023',
      img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=60&h=60&fit=crop&crop=face',
      rating: 5,
      text: 'As someone who travels frequently, having access to my medical records digitally and being able to consult with my doctor through the chat feature has been invaluable. Smart Clinic Pro understands modern needs.',
    },
  ];

  const translations = {
    en: {
      nav_about: 'About', nav_doctors: 'Doctors', nav_booking: 'Booking', nav_contact: 'Contact',
      btn_login: 'Login', btn_signup: 'Sign Up', btn_book: 'Book Appointment', btn_doctors: 'Meet Our Doctors',
      btn_confirm_booking: 'Confirm Appointment', btn_done: 'Done',
      hero_badge: 'Now accepting new patients',
      hero_h1_line1: 'Your Health,', hero_h1_line2: 'Our Priority',
      hero_subtitle: 'World-class medical care, expert physicians, and a seamless digital experience — all in one place. Because you deserve the best.',
      stat_patients: 'Happy Patients', stat_doctors: 'Expert Doctors', stat_years: 'Years of Care', stat_rating: 'Patient Rating',
      section_about_badge: 'About Our Clinic', section_about_h: 'Where Compassion Meets Innovation',
      section_about_sub: 'Since 2010, Smart Clinic Pro has been transforming healthcare through cutting-edge technology, a patient-first philosophy, and a team of world-renowned specialists.',
      section_doctors_badge: 'Our Specialists', section_doctors_h: 'Expert Physicians You Can Trust',
      section_doctors_sub: 'Our board-certified specialists bring decades of experience and genuine compassion to every patient interaction.',
      section_booking_badge: 'Online Booking', section_booking_h: 'Schedule Your Appointment',
      section_booking_sub: 'Quick, easy, and secure. Book your appointment in under 2 minutes.',
      section_test_badge: 'Patient Testimonials', section_test_h: 'Voices of Our Patients',
      section_test_sub: 'Real stories from real patients. Their trust drives everything we do.',
      show_more: 'Show More',
      spec_internal: 'Internal Medicine', spec_dentistry: 'Dentistry', spec_ortho: 'Orthopedics',
      tab_all: 'All', tab_internal: 'Internal Medicine', tab_dentistry: 'Dentistry', tab_ortho: 'Orthopedics',
      form_name: 'Full Name', form_age: 'Age', form_gender: 'Gender', form_specialty: 'Specialty',
      form_date: 'Preferred Date', form_phone: 'Phone Number', form_notes: 'Notes / Symptoms',
      form_email: 'Email Address', form_password: 'Password', form_remember: 'Remember me',
      form_forgot: 'Forgot password?', form_first_name: 'First Name', form_last_name: 'Last Name',
      form_role: 'Register as', form_agree: 'I agree to the Terms of Service and Privacy Policy. An email verification will be sent to confirm your account.',
      gender_male: 'Male', gender_female: 'Female', gender_child: 'Child (under 12)',
      login_title: 'Welcome Back', login_sub: 'Sign in to your Smart Clinic Pro account',
      signup_title: 'Create Your Account', signup_sub: 'Join Smart Clinic Pro today',
      login_no_acc: "Don't have an account?", signup_has_acc: 'Already have an account?',

      overall_rating: 'Overall Rating', rating_care: 'Quality of Care', rating_staff: 'Staff Friendliness',
      rating_facility: 'Facility', rating_wait: 'Wait Time',
      about_feat1_title: 'JCI Accredited Excellence', about_feat2_title: 'Advanced Diagnostic Technology', about_feat3_title: 'Holistic Patient Care',
      svc_internal: 'Internal Medicine', svc_dentistry: 'Dentistry', svc_ortho: 'Orthopedics',
      booking_note: 'You will receive a confirmation email within 30 minutes.',
      success_title: 'Appointment Booked!', success_desc: "Your appointment has been submitted. You'll receive a confirmation email within 30 minutes once the doctor approves it.",
      cta_title: 'Ready to prioritize your health?', cta_sub: 'Join 12,000+ patients who trust Smart Clinic Pro.',
      footer_brand_desc: 'Delivering world-class healthcare with compassion, innovation, and the highest professional standards.',
      footer_links: 'Quick Links', footer_services: 'Specialties',
      hours_weekday: 'Mon–Sat: 8AM – 8PM', hours_emergency: 'Emergency: 24/7',
      scroll_down: 'Scroll to explore', tagline: 'Advanced Medical Care',
      chat_placeholder: 'Type a message...',
      search_placeholder: 'Search doctors, specialties, services...',
      contact_phone: 'Phone', contact_email: 'Email', contact_address: 'Address',
      float1_title: 'Appointment Confirmed', float1_sub: 'Dr. Sarah Mitchell • Today, 2 PM',
      float2_title: 'Top Rated Clinic',
      dd_about_rating: 'Our Ratings', dd_about_rating_sub: '4.9★ from 2,400+ patients',
      dd_about_services: 'Our Services', dd_about_services_sub: 'Comprehensive care solutions',
      dd_about_gallery: 'Gallery', dd_about_gallery_sub: 'Our world-class facilities',
      spec_internal_sub: 'General & preventive care', spec_dentistry_sub: 'Oral health specialists', spec_ortho_sub: 'Bone & joint specialists',
      svc_internal_sub: 'Diagnosis & prevention', svc_dentistry_sub: 'Complete oral care', svc_ortho_sub: 'Bone & joint care',
      about_feat1_desc: 'Internationally accredited by the Joint Commission, meeting the world\'s highest standards in patient safety and quality care.',
      about_feat2_desc: 'Equipped with the latest MRI, CT scans, and AI-assisted diagnostic tools for precision medicine and faster results.',
      about_feat3_desc: 'Every patient receives a personalized care plan, continuous follow-ups, and 24/7 digital access to their medical team.',
      form_name_ph: 'John Doe', form_age_ph: '35', form_phone_ph: '+1 (555) 000-0000', form_notes_ph: 'Briefly describe your symptoms or reason for visit...',
    },
    ar: {
      nav_about: 'عن العيادة', nav_doctors: 'الأطباء', nav_booking: 'الحجز', nav_contact: 'اتصل بنا',
      btn_login: 'تسجيل الدخول', btn_signup: 'إنشاء حساب', btn_book: 'احجز موعداً', btn_doctors: 'تعرف على أطبائنا',
      btn_confirm_booking: 'تأكيد الموعد', btn_done: 'تم',
      hero_badge: 'نقبل مرضى جدد الآن',
      hero_h1_line1: 'صحتك،', hero_h1_line2: 'أولويتنا',
      hero_subtitle: 'رعاية طبية عالمية المستوى، أطباء متخصصون، وتجربة رقمية سلسة — كل ذلك في مكان واحد. لأنك تستحق الأفضل.',
      stat_patients: 'مريض سعيد', stat_doctors: 'طبيب متخصص', stat_years: 'سنوات من الرعاية', stat_rating: 'تقييم المرضى',
      section_about_badge: 'عن عيادتنا', section_about_h: 'حيث تلتقي الرحمة بالابتكار',
      section_about_sub: 'منذ عام 2010، تُحوّل سمارت كلينيك برو مسار الرعاية الصحية من خلال أحدث التقنيات وفلسفة المريض أولاً وفريق من المتخصصين العالميين.',
      section_doctors_badge: 'متخصصونا', section_doctors_h: 'أطباء متخصصون يمكنك الوثوق بهم',
      section_doctors_sub: 'يجلب متخصصونا المعتمدون عقوداً من الخبرة والتعاطف الحقيقي لكل تفاعل مع المريض.',
      section_booking_badge: 'الحجز الإلكتروني', section_booking_h: 'جدول موعدك',
      section_booking_sub: 'سريع وسهل وآمن. احجز موعدك في أقل من دقيقتين.',
      section_test_badge: 'آراء المرضى', section_test_h: 'أصوات مرضانا',
      section_test_sub: 'قصص حقيقية من مرضى حقيقيين. ثقتهم تدفعنا إلى الأمام.',
      show_more: 'عرض المزيد',
      spec_internal: 'الطب الداخلي', spec_dentistry: 'طب الأسنان', spec_ortho: 'العظام والمفاصل',
      tab_all: 'الجميع', tab_internal: 'الطب الداخلي', tab_dentistry: 'طب الأسنان', tab_ortho: 'العظام',
      form_name: 'الاسم الكامل', form_age: 'العمر', form_gender: 'الجنس', form_specialty: 'التخصص',
      form_date: 'التاريخ المفضل', form_phone: 'رقم الهاتف', form_notes: 'ملاحظات / أعراض',
      form_email: 'البريد الإلكتروني', form_password: 'كلمة المرور', form_remember: 'تذكرني',
      form_forgot: 'نسيت كلمة المرور؟', form_first_name: 'الاسم الأول', form_last_name: 'اسم العائلة',
      form_role: 'سجّل كـ', form_agree: 'أوافق على شروط الخدمة وسياسة الخصوصية. سيُرسل إليك رسالة تحقق بالبريد الإلكتروني.',
      gender_male: 'ذكر', gender_female: 'أنثى', gender_child: 'طفل (أقل من 12)',
      login_title: 'مرحباً بعودتك', login_sub: 'سجّل الدخول إلى حسابك في سمارت كلينيك برو',
      signup_title: 'إنشاء حسابك', signup_sub: 'انضم إلى سمارت كلينيك برو اليوم',
      login_no_acc: 'ليس لديك حساب؟', signup_has_acc: 'لديك حساب بالفعل؟',

      overall_rating: 'التقييم العام', rating_care: 'جودة الرعاية', rating_staff: 'ودية الموظفين',
      rating_facility: 'المرافق', rating_wait: 'وقت الانتظار',
      about_feat1_title: 'اعتماد JCI للتميز', about_feat2_title: 'تقنيات تشخيصية متطورة', about_feat3_title: 'رعاية شاملة للمريض',
      svc_internal: 'الطب الداخلي', svc_dentistry: 'طب الأسنان', svc_ortho: 'العظام والمفاصل',
      booking_note: 'ستتلقى رسالة تأكيد بالبريد الإلكتروني خلال 30 دقيقة.',
      success_title: 'تم حجز الموعد!', success_desc: 'تم تقديم طلب موعدك. ستتلقى رسالة تأكيد بعد موافقة الطبيب.',
      cta_title: 'هل أنت مستعد لإعطاء صحتك الأولوية؟', cta_sub: 'انضم إلى أكثر من 12,000 مريض يثقون في سمارت كلينيك برو.',
      footer_brand_desc: 'تقديم رعاية صحية عالمية بالتعاطف والابتكار وأعلى المعايير المهنية.',
      footer_links: 'روابط سريعة', footer_services: 'التخصصات',
      hours_weekday: 'الاثنين–السبت: 8ص – 8م', hours_emergency: 'طوارئ: 24/7',
      scroll_down: 'مرر للاستكشاف', tagline: 'رعاية طبية متقدمة',
      chat_placeholder: 'اكتب رسالة...',
      search_placeholder: 'ابحث عن أطباء أو خدمات...',
      contact_phone: 'الهاتف', contact_email: 'البريد الإلكتروني', contact_address: 'العنوان',
      float1_title: 'الموعد مؤكد', float1_sub: 'د. سارة ميتشيل • اليوم، الساعة 2م',
      float2_title: 'العيادة الأعلى تقييماً',
      dd_about_rating: 'تقييماتنا', dd_about_rating_sub: '4.9★ من 2,400+ مريض',
      dd_about_services: 'خدماتنا', dd_about_services_sub: 'حلول رعاية شاملة',
      dd_about_gallery: 'معرض الصور', dd_about_gallery_sub: 'مرافقنا العالمية',
      spec_internal_sub: 'الرعاية العامة والوقائية', spec_dentistry_sub: 'متخصصو الصحة الفموية', spec_ortho_sub: 'متخصصو العظام والمفاصل',
      svc_internal_sub: 'التشخيص والوقاية', svc_dentistry_sub: 'الرعاية الفموية الكاملة', svc_ortho_sub: 'رعاية العظام والمفاصل',
      about_feat1_desc: 'معتمدة دولياً من لجنة المشتركة، وتلتزم بأعلى معايير العالم في سلامة المرضى وجودة الرعاية.',
      about_feat2_desc: 'مجهزة بأحدث أجهزة الرنين المغناطيسي والأشعة المقطعية وأدوات التشخيص بالذكاء الاصطناعي.',
      about_feat3_desc: 'كل مريض يحصل على خطة رعاية شخصية ومتابعات مستمرة ووصول رقمي 24/7 لفريقه الطبي.',
      form_name_ph: 'الاسم الكامل', form_age_ph: '35', form_phone_ph: '+966 5XX XXX XXXX', form_notes_ph: 'صف أعراضك أو سبب الزيارة...',
    },
    ru: {
      nav_about: 'О клинике', nav_doctors: 'Врачи', nav_booking: 'Запись', nav_contact: 'Контакты',
      btn_login: 'Войти', btn_signup: 'Регистрация', btn_book: 'Записаться', btn_doctors: 'Наши врачи',
      btn_confirm_booking: 'Подтвердить запись', btn_done: 'Готово',
      hero_badge: 'Принимаем новых пациентов',
      hero_h1_line1: 'Ваше здоровье,', hero_h1_line2: 'Наш приоритет',
      hero_subtitle: 'Медицинская помощь мирового класса, опытные врачи и удобный цифровой сервис — всё в одном месте. Потому что вы заслуживаете лучшего.',
      stat_patients: 'Довольных пациентов', stat_doctors: 'Врачей-специалистов', stat_years: 'Лет заботы', stat_rating: 'Рейтинг',
      section_about_badge: 'О нашей клинике', section_about_h: 'Там, где сострадание встречает инновации',
      section_about_sub: 'С 2010 года Smart Clinic Pro преобразует здравоохранение с помощью передовых технологий и команды всемирно известных специалистов.',
      section_doctors_badge: 'Наши специалисты', section_doctors_h: 'Врачи, которым можно доверять',
      section_doctors_sub: 'Наши сертифицированные специалисты привносят десятилетия опыта и искреннее сострадание в каждое взаимодействие с пациентом.',
      section_booking_badge: 'Онлайн-запись', section_booking_h: 'Запишитесь на приём',
      section_booking_sub: 'Быстро, легко и безопасно. Запишитесь на приём менее чем за 2 минуты.',
      section_test_badge: 'Отзывы пациентов', section_test_h: 'Голоса наших пациентов',
      section_test_sub: 'Реальные истории реальных пациентов. Их доверие движет всем, что мы делаем.',
      show_more: 'Показать ещё',
      spec_internal: 'Терапия', spec_dentistry: 'Стоматология', spec_ortho: 'Ортопедия',
      tab_all: 'Все', tab_internal: 'Терапия', tab_dentistry: 'Стоматология', tab_ortho: 'Ортопедия',
      form_name: 'Полное имя', form_age: 'Возраст', form_gender: 'Пол', form_specialty: 'Специальность',
      form_date: 'Предпочтительная дата', form_phone: 'Телефон', form_notes: 'Заметки / Симптомы',
      form_email: 'Электронная почта', form_password: 'Пароль', form_remember: 'Запомнить меня',
      form_forgot: 'Забыли пароль?', form_first_name: 'Имя', form_last_name: 'Фамилия',
      form_role: 'Зарегистрироваться как', form_agree: 'Я принимаю Условия использования и Политику конфиденциальности. Письмо с подтверждением будет отправлено на вашу почту.',
      gender_male: 'Мужской', gender_female: 'Женский', gender_child: 'Ребёнок (до 12 лет)',
      login_title: 'С возвращением', login_sub: 'Войдите в свой аккаунт Smart Clinic Pro',
      signup_title: 'Создать аккаунт', signup_sub: 'Присоединяйтесь к Smart Clinic Pro сегодня',
      login_no_acc: 'Нет аккаунта?', signup_has_acc: 'Уже есть аккаунт?',

      overall_rating: 'Общий рейтинг', rating_care: 'Качество помощи', rating_staff: 'Дружелюбность персонала',
      rating_facility: 'Оснащение', rating_wait: 'Время ожидания',
      about_feat1_title: 'Аккредитация JCI', about_feat2_title: 'Передовая диагностика', about_feat3_title: 'Комплексная помощь',
      svc_internal: 'Терапия', svc_dentistry: 'Стоматология', svc_ortho: 'Ортопедия',
      booking_note: 'Вы получите письмо с подтверждением в течение 30 минут.',
      success_title: 'Запись подтверждена!', success_desc: 'Ваш запрос на приём отправлен. Вы получите письмо с подтверждением после одобрения врача.',
      cta_title: 'Готовы позаботиться о своём здоровье?', cta_sub: 'Присоединяйтесь к 12 000+ пациентов, доверяющих Smart Clinic Pro.',
      footer_brand_desc: 'Медицинская помощь мирового класса с состраданием, инновациями и высочайшими профессиональными стандартами.',
      footer_links: 'Быстрые ссылки', footer_services: 'Специальности',
      hours_weekday: 'Пн–Сб: 8:00 – 20:00', hours_emergency: 'Скорая помощь: 24/7',
      scroll_down: 'Прокрутите, чтобы узнать больше', tagline: 'Передовая медицинская помощь',
      chat_placeholder: 'Введите сообщение...',
      search_placeholder: 'Поиск врачей, специальностей...',
      contact_phone: 'Телефон', contact_email: 'Эл. почта', contact_address: 'Адрес',
      float1_title: 'Приём подтверждён', float1_sub: 'Д-р Митчелл • Сегодня, 14:00',
      float2_title: 'Клиника с высшим рейтингом',
      dd_about_rating: 'Наш рейтинг', dd_about_rating_sub: '4.9★ от 2 400+ пациентов',
      dd_about_services: 'Наши услуги', dd_about_services_sub: 'Комплексные решения',
      dd_about_gallery: 'Галерея', dd_about_gallery_sub: 'Наши современные объекты',
      spec_internal_sub: 'Общая и профилактическая помощь', spec_dentistry_sub: 'Специалисты стоматологии', spec_ortho_sub: 'Специалисты по костям и суставам',
      svc_internal_sub: 'Диагностика и профилактика', svc_dentistry_sub: 'Полный уход за полостью рта', svc_ortho_sub: 'Уход за костями и суставами',
      about_feat1_desc: 'Международная аккредитация Объединённой комиссии, соответствие мировым стандартам безопасности пациентов.',
      about_feat2_desc: 'Оснащены новейшими МРТ, КТ и диагностическими инструментами на базе ИИ для точной медицины.',
      about_feat3_desc: 'Каждый пациент получает персональный план лечения, непрерывное наблюдение и круглосуточный цифровой доступ к своей медицинской команде.',
      form_name_ph: 'Иванов Иван', form_age_ph: '35', form_phone_ph: '+7 (XXX) XXX-XX-XX', form_notes_ph: 'Кратко опишите симптомы или причину визита...',
    }
  };

  const healthQuotes = [
    '"The greatest wealth is health." — Virgil',
    '"Take care of your body. It\'s the only place you have to live." — Jim Rohn',
    '"Health is not just about what you\'re eating. It\'s also about what you\'re thinking and saying." — Anonymous',
    '"An ounce of prevention is worth a pound of cure." — Benjamin Franklin',
    '"To keep the body in good health is a duty." — Buddha',
  ];

  const pendingApptData = [
    { patient: 'Emma Thompson', age: 34, gender: 'Female', date: 'Today, 2:30 PM', reason: 'Annual checkup and blood pressure review', status: 'pending' },
    { patient: 'Carlos Rivera', age: 45, gender: 'Male', date: 'Today, 4:00 PM', reason: 'Chest pain follow-up', status: 'pending' },
    { patient: 'Yuki Tanaka', age: 28, gender: 'Female', date: 'Tomorrow, 10:00 AM', reason: 'Diabetes management', status: 'pending' },
  ];

  const searchData = [
    { type: 'doctor', label: 'Dr. Sarah Mitchell', sub: 'Internal Medicine', href: '#doctors' },
    { type: 'doctor', label: 'Dr. James Patel', sub: 'Dentistry', href: '#doctors' },
    { type: 'doctor', label: 'Dr. Elena Volkov', sub: 'Orthopedics', href: '#doctors' },
    { type: 'doctor', label: 'Dr. Michael Osei', sub: 'Internal Medicine', href: '#doctors' },
    { type: 'doctor', label: 'Dr. Aisha Rahman', sub: 'Dentistry', href: '#doctors' },
    { type: 'doctor', label: 'Dr. Robert Chen', sub: 'Orthopedics', href: '#doctors' },
    { type: 'service', label: 'Internal Medicine', sub: 'General & preventive care', href: '#doctors' },
    { type: 'service', label: 'Dentistry', sub: 'Oral health specialists', href: '#doctors' },
    { type: 'service', label: 'Orthopedics', sub: 'Bone & joint specialists', href: '#doctors' },
    { type: 'page', label: 'Book Appointment', sub: 'Schedule your visit online', href: '#booking' },
    { type: 'page', label: 'About Smart Clinic Pro', sub: 'Our story and mission', href: '#about' },
    { type: 'page', label: 'Patient Testimonials', sub: 'What our patients say', href: '#testimonials' },
  ];

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

  window.sendChatMessage = async function() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    const container = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    container.innerHTML += `<div class="flex justify-end mt-2"><div class="msg-out px-4 py-2.5"><div class="text-sm leading-relaxed">${escapeHtml(msg)}</div><div class="flex items-center justify-end gap-1 mt-1.5"><span class="text-[10px] text-white/50">${time}</span><i class="fas fa-circle-notch fa-spin text-[9px] text-white/40 ml-0.5"></i></div></div></div>`;
    input.value = '';
    container.scrollTop = container.scrollHeight;

    const appt = await getOrCreateFloatingChatAppt();
    const senderEmail = appt?.patient_email || currentUser?.email || 'anonymous@visitor.com';

    const saved = await sendChatMessageToDB(
      appt?.id || null,
      senderEmail,
      'patient',
      msg
    );

    // Update sent status
    const lastOutgoing = container.querySelector('.flex.justify-end:last-child .bg-brand-600\\/80');
    if (lastOutgoing) {
      const statusEl = lastOutgoing.querySelector('.fa-circle-notch');
      if (statusEl) {
        statusEl.className = 'fas fa-check text-[9px] text-slate-400 ml-1';
      }
    }

    if (!saved) {
      container.innerHTML += `<div class="flex justify-end"><div class="text-[10px] text-red-400 mt-1">Message not saved — check connection</div></div>`;
      return;
    }

    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    container.innerHTML += `<div id="${typingId}" class="flex items-end gap-2 mt-2">
      <div class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center flex-shrink-0">
        <i class="fas fa-user-md text-white text-[10px]"></i>
      </div>
      <div class="msg-in">
        <div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>
      </div>
    </div>`;
    container.scrollTop = container.scrollHeight;

    setTimeout(async () => {
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      const replies = [
        'Thank you for reaching out. I will review your message and get back to you shortly.',
        'I have noted your concern. Please book an appointment if this needs immediate attention.',
        'Your message has been received. I will follow up on this during your next visit.',
        'Thank you. If symptoms worsen before your appointment, please do not hesitate to contact us.',
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      container.innerHTML += `<div class="flex items-end gap-2 mt-2">
        <div class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-user-md text-white text-[10px]"></i>
        </div>
        <div class="msg-in px-4 py-2.5">
          <span class="text-[10px] text-brand-400 font-semibold block mb-1">Doctor</span>
          <div class="text-sm leading-relaxed">${escapeHtml(reply)}</div>
          <div class="text-[10px] text-slate-600 mt-1.5">${replyTime}</div>
        </div>
      </div>`;
      container.scrollTop = container.scrollHeight;
    }, 1400);
  };

  // Load chat messages for floating chat on open
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

      // Load persisted messages
      const appt = await getOrCreateFloatingChatAppt();
      if (appt) {
        const msgs = await loadChatMessages(appt.id);
        if (msgs.length) {
          const container = document.getElementById('chatMessages');
          const welcomeHtml = container.innerHTML;
          container.innerHTML = welcomeHtml + _renderChatMessages(msgs, 'patient');
          container.scrollTop = container.scrollHeight;
        }
      }
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
      const { data } = await sbClient.from('doctor_profiles').select('*').eq('is_active', true);
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
      const { error } = await sbClient.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
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
    const btn=document.getElementById('fpResetBtn'); btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Resetting...';
    try {
      const{error:vE}=await sbClient.auth.verifyOtp({email:_fpEmailPending,token:code,type:'email'}); if(vE)throw vE;
      const{error:uE}=await sbClient.auth.updateUser({password:newPass}); if(uE)throw uE;
      closeModal('forgotPassModal'); resetForgotPass(); showToast('Password reset! Please log in.','success');
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
      document.getElementById('signupStep1Form').classList.add('hidden');
      document.getElementById('signupStep2Form').classList.remove('hidden');
      document.getElementById('suEmailDisplay').textContent = email;
      document.getElementById('su-step1-dot').className = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-green-500 text-white';
      document.getElementById('su-step1-dot').innerHTML = '<i class="fas fa-check text-[10px]"></i>';
      document.getElementById('su-step2-dot').className = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-brand-600 text-white';
      document.getElementById('su-step-label').textContent = 'Verify your email';
      showToast('Account created! Please check your email to verify.', 'success');
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
    // No longer used — verification is handled by clicking the email link.
    e.preventDefault();
    closeModal('signupModal');
    resetSignupForm();
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
    ['suFirstName','suLastName','suEmail','suPass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
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
      showToast('Appointment submitted successfully!', 'success');

    } catch (err) {
      console.error('Booking error:', err);
      showBookingError(err.message || 'Booking failed. Please try again.');
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
  const _specLabel = { internal:'Internal Medicine', dentistry:'Dentistry', ortho:'Orthopedics' };

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
      if (photoFile) {
        btn.innerHTML='<i class="fas fa-cloud-upload-alt fa-spin"></i> Uploading photo...';
        photo_url = await uploadDoctorPhoto(photoFile, email);
      }
      const payload = {email,display_name:name,specialty:spec,bio,is_active:true,doctor_password:password,permissions:{view_own_only:viewOwn,can_approve:canApprove,can_cancel:canCancel,is_admin:false}};
      if (photo_url) payload.photo_url = photo_url;
      const {error}=await sbClient.from('doctor_profiles').upsert(payload,{onConflict:'email'});
      if(error) throw error;
      showToast('Doctor saved!','success'); e.target.reset();
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

  const STRIPE_PK = 'pk_test_51TKmjKPTsSRcM7BzlKbe2K5XdWnWkwofiKnOaPXQQTVaVwFaNpWWPf91zHTi4KuBiN1ELtb5jw73S8ut11j8uXaU00WxXZxvAp';

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

  // ===========================
  // STYLE ACTIVE TAB INIT + AUTH
  // ===========================
  init();
  handlePaymentReturn();   // Handle Stripe redirect back
  loadDoctorsFromDB();
  initAuth();
});

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
