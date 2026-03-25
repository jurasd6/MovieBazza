import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

const VISIBLE_STEP = 6;

function App() {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('movie');
  const [activeFilter, setActiveFilter] = useState('Wszystkie');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);

  // AUTH
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authDropdown, setAuthDropdown] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', nickname: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const dropdownRef = useRef(null);

  // DANE
  const [movies, setMovies] = useState([]);
  const [actors, setActors] = useState([]);
  const [genres, setGenres] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);

  // FORMULARZ
  const [movieForm, setMovieForm] = useState({ tytul: '', opis: '', rok_produkcji: '', plakat_url: '', id_gatunku: '' });
  const [actorForm, setActorForm] = useState({ imie_nazwisko: '', zdjecie_url: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // AKTORZY SCROLL
  const actorsRef = useRef(null);

  useEffect(() => { fetchMovies(); fetchActors(); fetchGenres(); }, []);

  async function fetchMovies() {
    setMoviesLoading(true);
    const { data } = await supabase.from('filmy').select(`
      id, 
      tytul, 
      rok_produkcji, 
      opis, 
      plakat_url,
      gatunki_filmow ( gatunki ( nazwa ) )
    `).order('id', { ascending: false });
    setMovies(data || []);
    setMoviesLoading(false);
  }

  async function fetchActors() {
    const { data } = await supabase.from('aktorzy').select('id, imie_nazwisko, zdjecie_url');
    setActors(data || []);
  }

  async function fetchGenres() {
    const { data } = await supabase.from('gatunki').select('id, nazwa').order('nazwa');
    setGenres(data || []);
  }

  // AUTH
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAuthDropdown(false); setRegisterSuccess(false); setAuthError('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from('uzytkownicy').select('login, avatar_url').eq('id', userId).single();
    setProfile(data);
  }

  async function handleRegister() {
    setAuthError('');
    if (!authForm.nickname.trim()) { setAuthError('Login jest wymagany'); return; }
    if (!authForm.email.trim()) { setAuthError('Email jest wymagany'); return; }
    if (authForm.password.length < 6) { setAuthError('Hasło musi mieć minimum 6 znaków'); return; }
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({
      email: authForm.email, password: authForm.password,
      options: { data: { nickname: authForm.nickname } }
    });
    if (error) { setAuthError(error.message); setAuthLoading(false); return; }
    setAuthLoading(false); setRegisterSuccess(true);
    setAuthForm({ email: '', password: '', nickname: '' });
  }

  async function handleLogin() {
    setAuthError(''); setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
    if (error) { setAuthError(error.message); setAuthLoading(false); return; }
    setAuthLoading(false); setAuthDropdown(false);
    setAuthForm({ email: '', password: '', nickname: '' });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthDropdown(false);
  }

  async function handleAddMovie() {
    setFormError('');
    if (!movieForm.tytul.trim()) { setFormError('Tytuł jest wymagany'); return; }
    setFormLoading(true);
    const { error } = await supabase.from('filmy').insert({
      tytul: movieForm.tytul,
      opis: movieForm.opis || null,
      rok_produkcji: movieForm.rok_produkcji ? parseInt(movieForm.rok_produkcji) : null,
      plakat_url: movieForm.plakat_url || null,
    });
    if (error) { setFormError(error.message); setFormLoading(false); return; }
    if (movieForm.id_gatunku) {
      const { data: newMovie } = await supabase.from('filmy').select('id').order('id', { ascending: false }).limit(1).single();
      if (newMovie) await supabase.from('gatunki_filmow').insert({ id_filmu: newMovie.id, id_gatunku: parseInt(movieForm.id_gatunku) });
    }
    setFormLoading(false); setShowForm(false);
    setMovieForm({ tytul: '', opis: '', rok_produkcji: '', plakat_url: '', id_gatunku: '' });
    fetchMovies();
  }

  async function handleAddActor() {
    setFormError('');
    if (!actorForm.imie_nazwisko.trim()) { setFormError('Imię i nazwisko jest wymagane'); return; }
    setFormLoading(true);
    const { error } = await supabase.from('aktorzy').insert({
      imie_nazwisko: actorForm.imie_nazwisko,
      zdjecie_url: actorForm.zdjecie_url || null,
    });
    if (error) { setFormError(error.message); setFormLoading(false); return; }
    setFormLoading(false); setShowForm(false);
    setActorForm({ imie_nazwisko: '', zdjecie_url: '' });
    fetchActors();
  }

  const getInitials = () => {
    if (profile?.login) return profile.login.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return '?';
  };

  const scrollActors = (dir) => {
    actorsRef.current?.scrollBy({ left: dir * 500, behavior: 'smooth' });
  };

  // Filtrowanie + wyszukiwanie
  const allFiltered = movies.filter(m => {
    const matchesSearch = m.tytul.toLowerCase().includes(search.toLowerCase());
    
    let matchesGenre = true;
    if (activeFilter !== 'Wszystkie') {
      const movieGenres = m.gatunki_filmow?.map(gf => gf.gatunki?.nazwa) || [];
      matchesGenre = movieGenres.includes(activeFilter);
    }
    
    return matchesSearch && matchesGenre;
  });

  const visibleMovies = allFiltered.slice(0, visibleCount);
  const hasMore = visibleCount < allFiltered.length;

  const inputCls = "bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#e50914]/40 transition-all w-full";

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-black/80 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-10 h-16 flex items-center justify-between">
          <div className="text-2xl font-black tracking-tight select-none">
            MOVIE<span className="text-[#e50914]">BAZZA</span>
          </div>
          <ul className="hidden md:flex gap-8 list-none">
            {['Filmy', 'Aktorzy', 'Gatunki', 'Moje Oceny'].map(link => (
              <li key={link} className="text-[#666] text-sm font-medium hover:text-white cursor-pointer transition-colors duration-200 tracking-wide">{link}</li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <button onClick={() => { setFormType('actor'); setFormError(''); setShowForm(true); }}
                  className="border border-white/10 text-white/70 hover:text-white hover:border-white/30 px-4 py-1.5 rounded-md transition-all text-sm font-medium">
                  + Aktor
                </button>
                <button onClick={() => { setFormType('movie'); setFormError(''); setShowForm(true); }}
                  className="bg-[#e50914] hover:bg-[#f01020] text-white px-4 py-1.5 rounded-md font-semibold transition-all text-sm shadow-lg shadow-red-900/30">
                  + Film
                </button>
              </>
            )}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setAuthDropdown(v => !v)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-bold
                  ${user ? 'bg-[#e50914] text-white shadow-lg shadow-red-900/40' : 'bg-white/5 border border-white/10 text-white/50 hover:border-white/30 hover:text-white'}`}>
                {user ? <span>{getInitials()}</span> : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                )}
              </button>

              {authDropdown && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-72 bg-[#0f0f0f] border border-white/8 rounded-xl shadow-2xl overflow-hidden z-50">
                  {user ? (
                    <div>
                      <div className="flex items-center gap-3 px-4 py-4 bg-white/3 border-b border-white/5">
                        <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center text-xs font-black shrink-0">{getInitials()}</div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-white truncate">{profile?.login || 'Użytkownik'}</div>
                          <div className="text-xs text-white/30 truncate mt-0.5">{user.email}</div>
                        </div>
                      </div>
                      <div className="p-1.5">
                        {[
                          { icon: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></>, label: 'Moje recenzje' },
                          { icon: <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>, label: 'Mój profil' },
                        ].map(item => (
                          <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all text-sm text-left">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
                            {item.label}
                          </button>
                        ))}
                        <div className="h-px bg-white/5 my-1"/>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/30 hover:bg-[#e50914]/10 hover:text-[#e50914] transition-all text-sm text-left">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          Wyloguj się
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {registerSuccess ? (
                        <div className="flex flex-col items-center text-center px-6 py-8 gap-4">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <div>
                            <div className="font-bold text-white text-base mb-1">Konto utworzone!</div>
                            <div className="text-white/40 text-xs leading-relaxed">Możesz się teraz zalogować.</div>
                          </div>
                          <button onClick={() => { setRegisterSuccess(false); setAuthMode('login'); }}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/8 text-white/70 hover:text-white font-medium py-2.5 rounded-lg text-sm transition-all">
                            Zaloguj się
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex border-b border-white/5">
                            {['login', 'register'].map(mode => (
                              <button key={mode} onClick={() => { setAuthMode(mode); setAuthError(''); }}
                                className={`flex-1 py-3.5 text-xs font-semibold tracking-wide uppercase transition-all border-b-2 -mb-px
                                  ${authMode === mode ? 'text-white border-[#e50914]' : 'text-white/30 border-transparent hover:text-white/60'}`}>
                                {mode === 'login' ? 'Zaloguj' : 'Rejestracja'}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-col gap-2.5 p-4">
                            {authMode === 'register' && (
                              <input type="text" placeholder="Login" value={authForm.nickname}
                                onChange={e => setAuthForm(f => ({ ...f, nickname: e.target.value }))}
                                className="bg-white text-black placeholder-black/40 px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#e50914]/40 w-full" />
                            )}
                            <input type="email" placeholder="Email" value={authForm.email}
                              onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
                              className="bg-white text-black placeholder-black/40 px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#e50914]/40 w-full" />
                            <input type="password" placeholder="Hasło" value={authForm.password}
                              onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleRegister())}
                              className="bg-white text-black placeholder-black/40 px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#e50914]/40 w-full" />
                            {authError && (
                              <div className="text-[#e50914] text-xs bg-[#e50914]/8 border-l-2 border-[#e50914] px-3 py-2 rounded-md">{authError}</div>
                            )}
                            <button onClick={authMode === 'login' ? handleLogin : handleRegister} disabled={authLoading}
                              className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg text-sm transition-all mt-1">
                              {authLoading ? 'Ładowanie...' : authMode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-xl font-bold">{formType === 'movie' ? 'Dodaj Film' : 'Dodaj Aktora'}</h2>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all text-xl cursor-pointer border-none">×</button>
            </div>
            <div className="flex flex-col gap-3">
              {formType === 'movie' ? (
                <>
                  <input type="text" placeholder="Tytuł filmu *" value={movieForm.tytul}
                    onChange={e => setMovieForm(f => ({ ...f, tytul: e.target.value }))}
                    className={inputCls} />
                  <textarea placeholder="Opis..." value={movieForm.opis}
                    onChange={e => setMovieForm(f => ({ ...f, opis: e.target.value }))}
                    className={`${inputCls} resize-none h-24`} />
                  <div className="flex gap-3">
                    <select value={movieForm.id_gatunku} onChange={e => setMovieForm(f => ({ ...f, id_gatunku: e.target.value }))}
                      className="flex-1 bg-white text-black px-4 py-3 rounded-xl text-sm outline-none">
                      <option value="">Gatunek</option>
                      {genres.map(g => <option key={g.id} value={g.id}>{g.nazwa}</option>)}
                    </select>
                    <input type="number" placeholder="Rok" value={movieForm.rok_produkcji}
                      onChange={e => setMovieForm(f => ({ ...f, rok_produkcji: e.target.value }))}
                      className="w-24 bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none" />
                  </div>
                  <input type="text" placeholder="URL plakatu" value={movieForm.plakat_url}
                    onChange={e => setMovieForm(f => ({ ...f, plakat_url: e.target.value }))}
                    className={inputCls} />
                </>
              ) : (
                <>
                  <input type="text" placeholder="Imię Nazwisko *" value={actorForm.imie_nazwisko}
                    onChange={e => setActorForm(f => ({ ...f, imie_nazwisko: e.target.value }))}
                    className={inputCls} />
                  <input type="text" placeholder="URL zdjęcia" value={actorForm.zdjecie_url}
                    onChange={e => setActorForm(f => ({ ...f, zdjecie_url: e.target.value }))}
                    className={inputCls} />
                </>
              )}
              {formError && (
                <div className="text-[#e50914] text-xs bg-[#e50914]/8 border-l-2 border-[#e50914] px-3 py-2 rounded-md">{formError}</div>
              )}
              <button onClick={formType === 'movie' ? handleAddMovie : handleAddActor} disabled={formLoading}
                className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-all mt-1">
                {formLoading ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#e50914]/5 via-transparent to-transparent pointer-events-none"/>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#e50914]/4 blur-[120px] rounded-full pointer-events-none"/>
        <div className="max-w-[1600px] mx-auto px-10 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#e50914]/10 border border-[#e50914]/20 text-[#e50914] text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] animate-pulse"/>
            Twoja Kinowa Baza Danych
          </div>
          <h1 className="text-[clamp(2.8rem,5.5vw,5.5rem)] font-black leading-[0.92] uppercase tracking-tight mb-6">
            Movie<span className="text-[#e50914]">BAZZA</span>
          </h1>
          <p className="text-white/30 text-lg mb-14 font-light tracking-wide">Odkrywaj, oceniaj i śledź swoje ulubione filmy</p>
          <div className="flex justify-center items-center gap-16">
            {[{ count: movies.length, label: 'Filmów' }, { count: actors.length, label: 'Aktorów' }, { count: 42, label: 'Recenzji' }].map(({ count, label }, i) => (
              <div key={label} className="flex items-center gap-16">
                <div className="text-center">
                  <div className="text-5xl font-black text-white mb-1">{count}</div>
                  <div className="text-white/30 text-xs uppercase tracking-[4px]">{label}</div>
                </div>
                {i < 2 && <div className="w-px h-10 bg-white/8"/>}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div className="max-w-[1600px] mx-auto px-10">

        {/* FILMY */}
        <section className="py-14">
          {/* HEADER z wyszukiwarką */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
              <h2 className="text-2xl font-black uppercase tracking-wide">Najnowsze Filmy</h2>
            </div>
            {/* WYSZUKIWARKA */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Szukaj filmów..."
                value={search}
                onChange={e => { setSearch(e.target.value); setVisibleCount(VISIBLE_STEP); }}
                className="bg-white/5 border border-white/8 text-white placeholder-white/25 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:border-white/25 transition-colors w-52"
              />
              {search && (
                <button onClick={() => { setSearch(''); setVisibleCount(VISIBLE_STEP); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white transition-colors border-none bg-transparent cursor-pointer text-lg leading-none">
                  ×
                </button>
              )}
            </div>
          </div>

          {/* FILTRY GATUNKÓW */}
          <div className="flex gap-1 bg-white/3 border border-white/5 rounded-xl p-1 mb-8 w-fit">
            {['Wszystkie', ...genres.map(g => g.nazwa)].slice(0, 7).map(f => (
              <button key={f} onClick={() => { setActiveFilter(f); setVisibleCount(VISIBLE_STEP); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all tracking-wide
                  ${activeFilter === f ? 'bg-[#e50914] text-white shadow-md' : 'text-white/40 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>

          {/* GRID FILMÓW */}
          {moviesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-white/3 rounded-xl aspect-[2/3] animate-pulse"/>)}
            </div>
          ) : visibleMovies.length === 0 ? (
            <div className="text-center py-20 text-white/20">
              <div className="text-5xl mb-4">🎬</div>
              <div className="text-lg font-medium">{search ? `Brak wyników dla "${search}"` : 'Brak filmów w bazie'}</div>
              {user && !search && <div className="text-sm mt-2">Kliknij "+ Film" żeby dodać pierwszy!</div>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                {visibleMovies.map(movie => (
                  <div key={movie.id}
                    className="group relative bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className="relative w-full aspect-[2/3] overflow-hidden">
                      <img
                        src={movie.plakat_url || `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`}
                        alt={movie.tytul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.src = `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"/>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-sm font-bold leading-tight text-white">{movie.tytul}</h3>
                        {movie.rok_produkcji && <div className="text-white/40 text-xs mt-0.5">{movie.rok_produkcji}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* POKAŻ WIĘCEJ / MNIEJ */}
              <div className="flex items-center justify-center gap-4 mt-10">
                <div className="text-white/20 text-xs">
                  Pokazuję {visibleMovies.length} z {allFiltered.length} filmów
                </div>
                {hasMore && (
                  <button onClick={() => setVisibleCount(c => c + VISIBLE_STEP)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 text-white/70 hover:text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all">
                    Pokaż więcej
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                )}
                {visibleCount > VISIBLE_STEP && (
                  <button onClick={() => setVisibleCount(VISIBLE_STEP)}
                    className="text-white/30 hover:text-white/60 text-xs transition-colors">
                    Zwiń
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent"/>

        {/* AKTORZY */}
        <section className="py-14">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
              <h2 className="text-2xl font-black uppercase tracking-wide">Gwiazdy Kina</h2>
            </div>
            {/* STRZAŁKI */}
            <div className="flex gap-2">
              <button onClick={() => scrollActors(-1)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
              <button onClick={() => scrollActors(1)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>

          {actors.length === 0 ? (
            <div className="text-center py-12 text-white/20">
              <div className="text-4xl mb-3">🎭</div>
              <div className="text-sm">Brak aktorów w bazie</div>
            </div>
          ) : (
            <div ref={actorsRef} className="flex gap-8 overflow-x-auto pb-4 [scrollbar-width:none] scroll-smooth">
              {actors.map(actor => (
                <div key={actor.id} className="min-w-[130px] text-center cursor-pointer group flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-[#e50914]/0 group-hover:bg-[#e50914]/15 transition-all duration-300 scale-110"/>
                    <img
                      src={actor.zdjecie_url || 'https://placehold.co/200x200/111/222?text=?'}
                      alt={actor.imie_nazwisko}
                      className="w-28 h-28 rounded-full object-cover border-2 border-white/8 group-hover:border-[#e50914]/60 transition-all duration-300 relative z-10"
                      onError={e => { e.target.src = 'https://placehold.co/200x200/111/222?text=?'; }}
                    />
                  </div>
                  <h4 className="font-bold text-sm text-white/80 group-hover:text-white transition-colors">{actor.imie_nazwisko}</h4>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-[1600px] mx-auto px-10 py-8 flex items-center justify-between">
          <div className="text-lg font-black">MOVIE<span className="text-[#e50914]">BAZZA</span></div>
          <div className="text-white/20 text-xs">© {new Date().getFullYear()} MovieBazza. Wszystkie prawa zastrzeżone.</div>
        </div>
      </footer>

    </div>
  )
}

export default App