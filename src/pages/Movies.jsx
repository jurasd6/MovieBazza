import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const VISIBLE_STEP = 6;

export default function Movies({ user }) {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Wszystkie');
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);
  const [favorites, setFavorites] = useState(new Set()); // Set id_filmu
  const [favLoading, setFavLoading] = useState(new Set()); // Set id_filmu w trakcie zapisu

  useEffect(() => {
    fetchMovies();
    fetchGenres();
  }, []);

  useEffect(() => {
    if (user) fetchFavorites();
    else setFavorites(new Set());
  }, [user]);

  async function fetchMovies() {
    setMoviesLoading(true);
    const { data } = await supabase.from('filmy').select(`
      id, tytul, rok_produkcji, opis, plakat_url,
      gatunki_filmow ( gatunki ( nazwa ) )
    `).order('id', { ascending: false });
    setMovies(data || []);
    setMoviesLoading(false);
  }

  async function fetchGenres() {
    const { data } = await supabase.from('gatunki').select('id, nazwa').order('nazwa');
    setGenres(data || []);
  }

  async function fetchFavorites() {
    const { data } = await supabase
      .from('ulubione')
      .select('id_filmu')
      .eq('id_uzytkownika', user.id);
    setFavorites(new Set((data || []).map(f => f.id_filmu)));
  }

  async function toggleFavorite(e, movieId) {
    e.preventDefault(); // nie przechodź do strony filmu
    if (!user) return;

    // Zapobiegnij podwójnemu kliknięciu
    if (favLoading.has(movieId)) return;
    setFavLoading(prev => new Set(prev).add(movieId));

    const isFav = favorites.has(movieId);

    if (isFav) {
      await supabase
        .from('ulubione')
        .delete()
        .eq('id_uzytkownika', user.id)
        .eq('id_filmu', movieId);
      setFavorites(prev => { const s = new Set(prev); s.delete(movieId); return s; });
    } else {
      await supabase
        .from('ulubione')
        .insert({ id_uzytkownika: user.id, id_filmu: movieId });
      setFavorites(prev => new Set(prev).add(movieId));
    }

    setFavLoading(prev => { const s = new Set(prev); s.delete(movieId); return s; });
  }

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

  return (
    <div>
      {/* HERO */}
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
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-[1600px] mx-auto px-10 py-14">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
            <h2 className="text-2xl font-black uppercase tracking-wide">Najnowsze Filmy</h2>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Szukaj filmów..." value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(VISIBLE_STEP); }}
              className="bg-white/5 border border-white/8 text-white placeholder-white/25 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:border-white/25 transition-colors w-52" />
          </div>
        </div>

        <div className="flex gap-1 bg-white/3 border border-white/5 rounded-xl p-1 mb-8 w-fit">
          {['Wszystkie', ...genres.map(g => g.nazwa)].slice(0, 7).map(f => (
            <button key={f} onClick={() => { setActiveFilter(f); setVisibleCount(VISIBLE_STEP); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all tracking-wide ${activeFilter === f ? 'bg-[#e50914] text-white shadow-md' : 'text-white/40 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>

        {moviesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white/3 rounded-xl aspect-[2/3] animate-pulse"/>)}
          </div>
        ) : visibleMovies.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <div className="text-5xl mb-4">🎬</div>
            <div className="text-lg font-medium">{search ? `Brak wyników dla "${search}"` : 'Brak filmów w bazie'}</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
              {visibleMovies.map(movie => {
                const isFav = favorites.has(movie.id);
                const isLoading = favLoading.has(movie.id);
                return (
                  <Link
                    to={`/film/${movie.id}`}
                    key={movie.id}
                    className="group relative bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 block"
                  >
                    <div className="relative w-full aspect-[2/3] overflow-hidden">
                      <img
                        src={movie.plakat_url || `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`}
                        alt={movie.tytul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.src = `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"/>

                      {/* SERDUSZKO */}
                      {user && (
                        <button
                          onClick={(e) => toggleFavorite(e, movie.id)}
                          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-none cursor-pointer z-10
                            ${isFav
                              ? 'bg-[#e50914] text-white shadow-lg shadow-red-900/40 scale-110'
                              : 'bg-black/50 backdrop-blur-sm text-white/50 hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100'
                            }
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                        >
                          <svg
                            width="14" height="14" viewBox="0 0 24 24"
                            fill={isFav ? 'currentColor' : 'none'}
                            stroke="currentColor" strokeWidth="2.5"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-sm font-bold leading-tight text-white">{movie.tytul}</h3>
                        {movie.rok_produkcji && <div className="text-white/40 text-xs mt-0.5">{movie.rok_produkcji}</div>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-10">
              {hasMore && (
                <button onClick={() => setVisibleCount(c => c + VISIBLE_STEP)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/8 text-white/70 hover:text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all">
                  Pokaż więcej
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
