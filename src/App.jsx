import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('movie');
  const [activeFilter, setActiveFilter] = useState('Wszystkie');

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authDropdown, setAuthDropdown] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', nickname: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const dropdownRef = useRef(null);

  const movies = [
    { id: 1, title: "Gladiator II", genre: "Akcja", year: 2024, rating: 8.5, img: "https://image.tmdb.org/t/p/w500/q719jXXLsU9P6uuzHwbiuxtccC8.jpg" },
    { id: 2, title: "Joker: Folie à Deux", genre: "Dramat", year: 2024, rating: 6.2, img: "https://image.tmdb.org/t/p/w500/8cdcl36ZGb9v6p6An9p677Yf6S.jpg" },
    { id: 3, title: "The Batman", genre: "Kryminał", year: 2022, rating: 9.0, img: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLv1oYI8fs.jpg" },
    { id: 4, title: "Dune: Part Two", genre: "Sci-Fi", year: 2024, rating: 8.8, img: "https://image.tmdb.org/t/p/w500/mS9u0S2l0l5N8iBqW6Vv6W4Wl2z.jpg" },
    { id: 5, title: "Interstellar", genre: "Sci-Fi", year: 2014, rating: 9.5, img: "https://image.tmdb.org/t/p/w500/gEU2QvE6ZSHuYvC9pxC6f1vSfBn.jpg" },
    { id: 6, title: "Incepcja", genre: "Akcja", year: 2010, rating: 8.8, img: "https://image.tmdb.org/t/p/w500/edv5uSjSNIcJuS1YpkpXvwhhpRz.jpg" },
  ];

  const actors = [
    { id: 1, name: "Paul Mescal", role: "Lucius", img: "https://image.tmdb.org/t/p/w200/9S7m9uJ38K3n78k9p3vG7p4YF1V.jpg" },
    { id: 2, name: "Joaquin Phoenix", role: "Joker", img: "https://image.tmdb.org/t/p/w200/n8199U9pD7SleA1nQa63FE8y89O.jpg" },
    { id: 3, name: "Robert Pattinson", role: "Bruce Wayne", img: "https://image.tmdb.org/t/p/w200/869f68J8YpE4H9Uo6Vv8YpE4H9U.jpg" },
  ];

  const filters = ['Wszystkie', 'Akcja', 'Dramat', 'Sci-Fi', 'Kryminał'];
  const filteredMovies = activeFilter === 'Wszystkie' ? movies : movies.filter(m => m.genre === activeFilter);

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
        setAuthDropdown(false);
        setRegisterSuccess(false);
        setAuthError('');
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
    setAuthLoading(false);
    setRegisterSuccess(true);
    setAuthForm({ email: '', password: '', nickname: '' });
  }

  async function handleLogin() {
    setAuthError('');
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
    if (error) { setAuthError(error.message); setAuthLoading(false); return; }
    setAuthLoading(false);
    setAuthDropdown(false);
    setAuthForm({ email: '', password: '', nickname: '' });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthDropdown(false);
  }

  const getInitials = () => {
    if (profile?.login) return profile.login.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return '?';
  };

  const ratingColor = (r) => r >= 9 ? 'text-emerald-400' : r >= 7.5 ? 'text-yellow-400' : 'text-orange-400';

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
              <li key={link}
                className="text-[#666] text-sm font-medium hover:text-white cursor-pointer transition-colors duration-200 tracking-wide">
                {link}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <button onClick={() => { setFormType('actor'); setShowForm(true); }}
                  className="border border-white/10 text-white/70 hover:text-white hover:border-white/30 px-4 py-1.5 rounded-md transition-all text-sm font-medium">
                  + Aktor
                </button>
                <button onClick={() => { setFormType('movie'); setShowForm(true); }}
                  className="bg-[#e50914] hover:bg-[#f01020] text-white px-4 py-1.5 rounded-md font-semibold transition-all text-sm shadow-lg shadow-red-900/30">
                  + Film
                </button>
              </>
            )}

            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setAuthDropdown(v => !v)}
                title={user ? (profile?.login || user.email) : 'Zaloguj się'}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-bold
                  ${user ? 'bg-[#e50914] text-white shadow-lg shadow-red-900/40'
                         : 'bg-white/5 border border-white/10 text-white/50 hover:border-white/30 hover:text-white'}`}>
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
                        <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center text-xs font-black shrink-0 shadow-md">
                          {getInitials()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-white truncate">{profile?.login || 'Użytkownik'}</div>
                          <div className="text-xs text-white/30 truncate mt-0.5">{user.email}</div>
                        </div>
                      </div>
                      <div className="p-1.5">
                        {[
                          { icon: <path d="M12 20h9"/>, icon2: <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>, label: 'Moje recenzje' },
                          { icon: <circle cx="12" cy="8" r="4"/>, icon2: <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>, label: 'Mój profil' },
                        ].map(item => (
                          <button key={item.label}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all text-sm text-left">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              {item.icon}{item.icon2}
                            </svg>
                            {item.label}
                          </button>
                        ))}
                        <div className="h-px bg-white/5 my-1"/>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/30 hover:bg-[#e50914]/10 hover:text-[#e50914] transition-all text-sm text-left">
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
                        // EKRAN SUKCESU REJESTRACJI
                        <div className="flex flex-col items-center text-center px-6 py-8 gap-4">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                          <div>
                            <div className="font-bold text-white text-base mb-1">Sprawdź swoją skrzynkę!</div>
                            <div className="text-white/40 text-xs leading-relaxed">
                              Wysłaliśmy link potwierdzający na Twój adres email. Kliknij go żeby aktywować konto.
                            </div>
                          </div>
                          <button
                            onClick={() => { setRegisterSuccess(false); setAuthMode('login'); }}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/8 text-white/70 hover:text-white font-medium py-2.5 rounded-lg text-sm transition-all mt-1">
                            Wróć do logowania
                          </button>
                        </div>
                      ) : (
                        // FORMULARZ LOGOWANIA / REJESTRACJI
                        <div>
                          <div className="flex border-b border-white/5">
                            {['login', 'register'].map(mode => (
                              <button key={mode}
                                onClick={() => { setAuthMode(mode); setAuthError(''); }}
                                className={`flex-1 py-3.5 text-xs font-semibold tracking-wide uppercase transition-all border-b-2 -mb-px
                                  ${authMode === mode ? 'text-white border-[#e50914]' : 'text-white/30 border-transparent hover:text-white/60'}`}>
                                {mode === 'login' ? 'Zaloguj' : 'Rejestracja'}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-col gap-2.5 p-4">
                            {authMode === 'register' && (
                              <input type="text" placeholder="Login"
                                value={authForm.nickname}
                                onChange={e => setAuthForm(f => ({ ...f, nickname: e.target.value }))}
                                className="bg-white text-black placeholder-black/40 px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#e50914]/60 transition-colors w-full" />
                            )}
                            <input type="email" placeholder="Email"
                              value={authForm.email}
                              onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
                              className="bg-white text-black placeholder-black/40 px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#e50914]/60 transition-colors w-full" />
                            <input type="password" placeholder="Hasło"
                              value={authForm.password}
                              onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleRegister())}
                              className="bg-white text-black placeholder-black/40 px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-[#e50914]/60 transition-colors w-full" />
                            {authError && (
                              <div className="text-[#e50914] text-xs bg-[#e50914]/8 border-l-2 border-[#e50914] px-3 py-2 rounded-md">
                                {authError}
                              </div>
                            )}
                            <button onClick={authMode === 'login' ? handleLogin : handleRegister}
                              disabled={authLoading}
                              className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg text-sm transition-all mt-1 shadow-lg shadow-red-900/20">
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
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all text-lg cursor-pointer border-none">
                ×
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {formType === 'movie' ? (
                <>
                  <input type="text" placeholder="Tytuł filmu"
                    className="bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#e50914]/60 transition-colors" />
                  <textarea placeholder="Opis..."
                    className="bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#e50914]/60 transition-colors resize-none h-24" />
                  <div className="flex gap-3">
                    <select className="flex-1 bg-white/3 border border-white/8 text-white px-4 py-3 rounded-xl text-sm outline-none focus:border-[#e50914]/60 transition-colors">
                      <option value="">Gatunek</option>
                      {['Akcja','Dramat','Sci-Fi','Kryminał','Komedia','Horror'].map(g => <option key={g}>{g}</option>)}
                    </select>
                    <input type="number" placeholder="Rok"
                      className="w-28 bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#e50914]/60 transition-colors" />
                  </div>
                  <input type="text" placeholder="URL plakatu"
                    className="bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#e50914]/60 transition-colors" />
                </>
              ) : (
                <>
                  <input type="text" placeholder="Imię Nazwisko"
                    className="bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#e50914]/60 transition-colors" />
                  <input type="text" placeholder="URL zdjęcia"
                    className="bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none focus:border-[#e50914]/60 transition-colors" />
                </>
              )}
              <button onClick={() => setShowForm(false)}
                className="bg-[#e50914] hover:bg-[#f01020] text-white font-semibold py-3 rounded-xl text-sm transition-all mt-1 shadow-lg shadow-red-900/20">
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <header className="relative overflow-hidden border-b border-white/5">
        {/* Tło z gradientem */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#e50914]/5 via-transparent to-transparent pointer-events-none"/>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#e50914]/4 blur-[120px] rounded-full pointer-events-none"/>

        <div className="max-w-[1600px] mx-auto px-10 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#e50914]/10 border border-[#e50914]/20 text-[#e50914] text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] animate-pulse"/>
            Twoja Kinowa Baza Danych
          </div>

          <h1 className="text-[clamp(2.8rem,5.5vw,5.5rem)] font-black leading-[0.92] uppercase tracking-tight mb-6">
            Movie<span className="text-[#e50914]">Bazza</span>
          </h1>
          <p className="text-white/30 text-lg mb-14 font-light tracking-wide">
            Odkrywaj, oceniaj i śledź swoje ulubione filmy
          </p>

          <div className="flex justify-center items-center gap-16">
            {[
              { count: movies.length, label: 'Filmów' },
              { count: actors.length, label: 'Aktorów' },
              { count: 42, label: 'Recenzji' },
            ].map(({ count, label }, i) => (
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
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
              <h2 className="text-2xl font-black uppercase tracking-wide">Najnowsze Filmy</h2>
            </div>
            <div className="flex gap-1 bg-white/3 border border-white/5 rounded-xl p-1">
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all tracking-wide
                    ${activeFilter === f
                      ? 'bg-[#e50914] text-white shadow-md'
                      : 'text-white/40 hover:text-white'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
            {filteredMovies.map(movie => (
              <div key={movie.id}
                className="group relative bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <div className="relative w-full aspect-[2/3] overflow-hidden">
                  <img src={movie.img} alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"/>
                  {/* rating */}
                  <div className={`absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold ${ratingColor(movie.rating)}`}>
                    ★ {movie.rating}
                  </div>
                  {/* info na dole obrazka */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-bold leading-tight text-white">{movie.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/40 text-xs">{movie.year}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"/>
                      <span className="text-white/40 text-xs">{movie.genre}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEPARATOR */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent"/>

        {/* AKTORZY */}
        <section className="py-14">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
            <h2 className="text-2xl font-black uppercase tracking-wide">Gwiazdy Kina</h2>
          </div>

          <div className="flex gap-8 overflow-x-auto pb-4 [scrollbar-width:none]">
            {actors.map(actor => (
              <div key={actor.id}
                className="min-w-[130px] text-center cursor-pointer group flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 rounded-full bg-[#e50914]/0 group-hover:bg-[#e50914]/20 transition-all duration-300 scale-110"/>
                  <img src={actor.img} alt={actor.name}
                    className="w-28 h-28 rounded-full object-cover border-2 border-white/8 group-hover:border-[#e50914]/60 transition-all duration-300 relative z-10" />
                </div>
                <h4 className="font-bold text-sm text-white/80 group-hover:text-white transition-colors">{actor.name}</h4>
                <span className="text-white/30 text-xs mt-0.5">{actor.role}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-[1600px] mx-auto px-10 py-8 flex items-center justify-between">
          <div className="text-lg font-black">MOVIE<span className="text-[#e50914]">BAZZA</span></div>
          <div className="text-white/20 text-xs">© 2025 MovieBazza. Wszystkie prawa zastrzeżone.</div>
        </div>
      </footer>

    </div>
  )
}

export default App
