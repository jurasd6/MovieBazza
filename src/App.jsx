import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Movies from './pages/Movies';
import Actors from './pages/Actors';
import Genres from './pages/Genres';
import MyRatings from './pages/MyRatings';
import MovieDetails from './pages/MovieDetails';
import Favorites from './pages/Favorites';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('movie');
  const [genres, setGenres] = useState([]);

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

  // FORMULARZ
  const [movieForm, setMovieForm] = useState({ tytul: '', opis: '', rok_produkcji: '', plakat_url: '', id_gatunku: '' });
  const [actorForm, setActorForm] = useState({ imie_nazwisko: '', zdjecie_url: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function fetchGenres() {
      const { data } = await supabase.from('gatunki').select('id, nazwa').order('nazwa');
      setGenres(data || []);
    }
    fetchGenres();
  }, []);

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
    const { data } = await supabase.from('uzytkownicy').select('login, avatar_url, rola').eq('id', userId).single();
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
      tytul: movieForm.tytul, opis: movieForm.opis || null,
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
    window.location.reload(); // Prosty sposób na odświeżenie danych na podstronie po dodaniu
  }

  async function handleAddActor() {
    setFormError('');
    if (!actorForm.imie_nazwisko.trim()) { setFormError('Imię i nazwisko jest wymagane'); return; }
    setFormLoading(true);
    const { error } = await supabase.from('aktorzy').insert({ imie_nazwisko: actorForm.imie_nazwisko, zdjecie_url: actorForm.zdjecie_url || null });
    if (error) { setFormError(error.message); setFormLoading(false); return; }
    setFormLoading(false); setShowForm(false);
    setActorForm({ imie_nazwisko: '', zdjecie_url: '' });
    window.location.reload(); 
  }

  const getInitials = () => {
    if (profile?.login) return profile.login.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return '?';
  };

  const inputCls = "bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#e50914]/40 transition-all w-full";

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#080808] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ── NAVBAR ── */}
        <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-black/80 border-b border-white/5">
          <div className="max-w-[1600px] mx-auto px-10 h-16 flex items-center justify-between">
            <NavLink to="/" className="text-2xl font-black tracking-tight select-none no-underline text-white">
              MOVIE<span className="text-[#e50914]">BAZZA</span>
            </NavLink>
            <div className="hidden md:flex gap-8">
              {[
                { path: '/', label: 'Filmy' },
                { path: '/aktorzy', label: 'Aktorzy' },
                { path: '/gatunki', label: 'Gatunki' },
                { path: '/oceny', label: 'Moje Oceny' }
              ].map(link => (
                <NavLink key={link.path} to={link.path} className={({isActive}) => `text-sm font-medium transition-colors duration-200 tracking-wide ${isActive ? 'text-white' : 'text-[#666] hover:text-white'}`}>
                  {link.label}
                </NavLink>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              {profile?.rola === 'admin' && (
                <>
                  <button onClick={() => { setFormType('actor'); setFormError(''); setShowForm(true); }} className="border border-white/10 text-white/70 hover:text-white hover:border-white/30 px-4 py-1.5 rounded-md transition-all text-sm font-medium">+ Aktor</button>
                  <button onClick={() => { setFormType('movie'); setFormError(''); setShowForm(true); }} className="bg-[#e50914] hover:bg-[#f01020] text-white px-4 py-1.5 rounded-md font-semibold transition-all text-sm shadow-lg shadow-red-900/30">+ Film</button>
                </>
              )}
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setAuthDropdown(v => !v)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-bold ${user ? 'bg-[#e50914] text-white shadow-lg shadow-red-900/40' : 'bg-white/5 border border-white/10 text-white/50 hover:border-white/30 hover:text-white'}`}>
                  {user ? <span>{getInitials()}</span> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
                </button>

                {authDropdown && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-72 bg-[#0f0f0f] border border-white/8 rounded-xl shadow-2xl overflow-hidden z-50">
                    {user ? (
                      <div>
                        <div className="flex items-center gap-3 px-4 py-4 bg-white/3 border-b border-white/5">
                          <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center text-xs font-black shrink-0">{getInitials()}</div>
                          <div className="min-w-0"><div className="font-semibold text-sm text-white truncate">{profile?.login || 'Użytkownik'}</div><div className="text-xs text-white/30 truncate mt-0.5">{user.email}</div></div>
                        </div>
                        <div className="p-1.5">
                          <Link to="/ulubione" onClick={() => setAuthDropdown(false)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all text-sm no-underline">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            Moje ulubione
                          </Link>
                          <Link to="/oceny" onClick={() => setAuthDropdown(false)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all text-sm no-underline">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                            </svg>
                            Moje recenzje
                          </Link>
                          <div className="h-px bg-white/5 my-1"/>
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/30 hover:bg-[#e50914]/10 hover:text-[#e50914] transition-all text-sm text-left border-none bg-transparent cursor-pointer">
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
                            <div className="font-bold text-white text-base">Konto utworzone!</div>
                            <button onClick={() => { setRegisterSuccess(false); setAuthMode('login'); }} className="w-full bg-white/5 hover:bg-white/10 border border-white/8 text-white/70 hover:text-white font-medium py-2.5 rounded-lg text-sm transition-all">Zaloguj się</button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex border-b border-white/5">
                              {['login', 'register'].map(mode => (
                                <button key={mode} onClick={() => { setAuthMode(mode); setAuthError(''); }} className={`flex-1 py-3.5 text-xs font-semibold tracking-wide uppercase transition-all border-b-2 -mb-px ${authMode === mode ? 'text-white border-[#e50914]' : 'text-white/30 border-transparent hover:text-white/60'}`}>
                                  {mode === 'login' ? 'Zaloguj' : 'Rejestracja'}
                                </button>
                              ))}
                            </div>
                            <div className="flex flex-col gap-2.5 p-4">
                              {authMode === 'register' && <input type="text" placeholder="Login" value={authForm.nickname} onChange={e => setAuthForm(f => ({ ...f, nickname: e.target.value }))} className={inputCls} />}
                              <input type="email" placeholder="Email" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                              <input type="password" placeholder="Hasło" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleRegister())} className={inputCls} />
                              {authError && <div className="text-[#e50914] text-xs bg-[#e50914]/8 border-l-2 border-[#e50914] px-3 py-2 rounded-md">{authError}</div>}
                              <button onClick={authMode === 'login' ? handleLogin : handleRegister} disabled={authLoading} className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg text-sm transition-all mt-1">
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

        {/* ── MODAL DODAWANIA ── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
            <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-7">
                <h2 className="text-xl font-bold">{formType === 'movie' ? 'Dodaj Film' : 'Dodaj Aktora'}</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all text-xl cursor-pointer border-none">×</button>
              </div>
              <div className="flex flex-col gap-3">
                {formType === 'movie' ? (
                  <>
                    <input type="text" placeholder="Tytuł filmu *" value={movieForm.tytul} onChange={e => setMovieForm(f => ({ ...f, tytul: e.target.value }))} className={inputCls} />
                    <textarea placeholder="Opis..." value={movieForm.opis} onChange={e => setMovieForm(f => ({ ...f, opis: e.target.value }))} className={`${inputCls} resize-none h-24`} />
                    <div className="flex gap-3">
                      <select value={movieForm.id_gatunku} onChange={e => setMovieForm(f => ({ ...f, id_gatunku: e.target.value }))} className="flex-1 bg-white text-black px-4 py-3 rounded-xl text-sm outline-none">
                        <option value="">Gatunek</option>
                        {genres.map(g => <option key={g.id} value={g.id}>{g.nazwa}</option>)}
                      </select>
                      <input type="number" placeholder="Rok" value={movieForm.rok_produkcji} onChange={e => setMovieForm(f => ({ ...f, rok_produkcji: e.target.value }))} className="w-24 bg-white text-black placeholder-black/40 px-4 py-3 rounded-xl text-sm outline-none" />
                    </div>
                    <input type="text" placeholder="URL plakatu" value={movieForm.plakat_url} onChange={e => setMovieForm(f => ({ ...f, plakat_url: e.target.value }))} className={inputCls} />
                  </>
                ) : (
                  <>
                    <input type="text" placeholder="Imię Nazwisko *" value={actorForm.imie_nazwisko} onChange={e => setActorForm(f => ({ ...f, imie_nazwisko: e.target.value }))} className={inputCls} />
                    <input type="text" placeholder="URL zdjęcia" value={actorForm.zdjecie_url} onChange={e => setActorForm(f => ({ ...f, zdjecie_url: e.target.value }))} className={inputCls} />
                  </>
                )}
                {formError && <div className="text-[#e50914] text-xs bg-[#e50914]/8 border-l-2 border-[#e50914] px-3 py-2 rounded-md">{formError}</div>}
                <button onClick={formType === 'movie' ? handleAddMovie : handleAddActor} disabled={formLoading} className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-all mt-1">
                  {formLoading ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ROUTES (PODSTRONY) ── */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Movies />} />
            <Route path="/aktorzy" element={<Actors />} />
            <Route path="/gatunki" element={<Genres />} />
            <Route path="/oceny" element={<MyRatings user={user} />} />
            <Route path="/film/:id" element={<MovieDetails user={user} />} />
            <Route path="/ulubione" element={<Favorites user={user} />} />
          </Routes>
        </main>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/5 mt-auto">
          <div className="max-w-[1600px] mx-auto px-10 py-8 flex items-center justify-between">
            <div className="text-lg font-black">MOVIE<span className="text-[#e50914]">BAZZA</span></div>
            <div className="text-white/20 text-xs">© 2026 MovieBazza. Wszystkie prawa zastrzeżone.</div>
          </div>
        </footer>

      </div>
    </BrowserRouter>
  )
}

export default App;