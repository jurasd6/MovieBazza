import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

// Kolory akcentów dla każdego gatunku
const GENRE_COLORS = {
  'Akcja':      'from-orange-500/20 to-transparent border-orange-500/20',
  'Animacja':   'from-blue-500/20 to-transparent border-blue-500/20',
  'Dramat':     'from-purple-500/20 to-transparent border-purple-500/20',
  'Fantasy':    'from-emerald-500/20 to-transparent border-emerald-500/20',
  'Horror':     'from-red-900/30 to-transparent border-red-900/30',
  'Komedia':    'from-yellow-500/20 to-transparent border-yellow-500/20',
  'Kryminał':   'from-slate-500/20 to-transparent border-slate-500/20',
  'Przygodowy': 'from-cyan-500/20 to-transparent border-cyan-500/20',
  'Romans':     'from-pink-500/20 to-transparent border-pink-500/20',
  'Sci-Fi':     'from-indigo-500/20 to-transparent border-indigo-500/20',
  'Thriller':   'from-zinc-500/20 to-transparent border-zinc-500/20',
  'Western':    'from-amber-700/20 to-transparent border-amber-700/20',
};

const DEFAULT_COLOR = 'from-white/5 to-transparent border-white/8';

export default function Genres() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchGenresWithMovies(); }, []);

  async function fetchGenresWithMovies() {
    const { data } = await supabase
      .from('gatunki')
      .select(`id, nazwa, gatunki_filmow ( filmy ( id, tytul, plakat_url, rok_produkcji ) )`)
      .order('nazwa');

    if (data) {
      const enriched = await Promise.all(data.map(async (g) => {
        const films = g.gatunki_filmow.map(gf => gf.filmy).filter(Boolean);
        const filmIds = films.map(f => f.id);
        let avgRating = null;
        if (filmIds.length > 0) {
          const { data: reviews } = await supabase.from('recenzje').select('ocena').in('id_filmu', filmIds);
          if (reviews?.length > 0)
            avgRating = (reviews.reduce((s, r) => s + r.ocena, 0) / reviews.length).toFixed(1);
        }
        return { ...g, films, avgRating };
      }));
      setGenres(enriched);
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="max-w-[1400px] mx-auto px-10 py-14">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
        <h2 className="text-2xl font-black uppercase tracking-wide">Przeglądaj Gatunki</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => <div key={i} className="bg-white/3 rounded-2xl h-40 animate-pulse"/>)}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-10 py-14">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
        <h2 className="text-2xl font-black uppercase tracking-wide">Przeglądaj Gatunki</h2>
        <span className="text-white/20 text-sm font-normal">{genres.length} gatunków</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {genres.map(genre => (
          <div key={genre.id}>
            <button
              onClick={() => setSelected(selected?.id === genre.id ? null : genre)}
              className={`w-full text-left rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 cursor-pointer bg-gradient-to-br
                ${GENRE_COLORS[genre.nazwa] || DEFAULT_COLOR}
                ${selected?.id === genre.id ? 'shadow-lg scale-[1.01]' : ''}`}
            >
              {/* PASEK PLAKATÓW */}
              <div className="flex h-24 overflow-hidden">
                {genre.films.slice(0, 4).map((film, i) => (
                  <div key={film.id} className="flex-1 relative overflow-hidden">
                    <img
                      src={film.plakat_url || `https://placehold.co/200x300/111/222?text=?`}
                      alt={film.tytul}
                      className="w-full h-full object-cover opacity-60"
                      onError={e => { e.target.src = 'https://placehold.co/200x300/111/222?text=?'; }}
                    />
                    <div className={`absolute inset-0 bg-black/${20 + i * 10}`}/>
                  </div>
                ))}
                {genre.films.length === 0 && (
                  <div className="flex-1 bg-white/3 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/10">
                      <rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none"/>
              </div>

              {/* INFO */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-black text-lg text-white leading-tight">{genre.nazwa}</div>
                  <div className="text-white/30 text-xs mt-0.5">
                    {genre.films.length} {genre.films.length === 1 ? 'film' : genre.films.length < 5 ? 'filmy' : 'filmów'}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {genre.avgRating && (
                    <div className="text-right">
                      <div className="text-yellow-400 font-black">★ {genre.avgRating}</div>
                      <div className="text-white/20 text-xs">śr. ocena</div>
                    </div>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={`text-white/30 transition-transform duration-300 ${selected?.id === genre.id ? 'rotate-180 text-white/60' : ''}`}>
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </button>

            {/* ROZWINIĘTE FILMY */}
            {selected?.id === genre.id && (
              <div className="mt-2 bg-[#0d0d0d] border border-white/5 rounded-2xl p-5">
                {genre.films.length === 0 ? (
                  <div className="text-center py-6 text-white/20 text-sm">Brak filmów w tym gatunku.</div>
                ) : (
                  <>
                    <div className="text-xs text-white/20 uppercase tracking-widest mb-4 font-semibold">
                      {genre.films.length} {genre.films.length === 1 ? 'film' : 'filmów'} w gatunku {genre.nazwa}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {genre.films.map(film => (
                        <Link key={film.id} to={`/film/${film.id}`} className="group no-underline block">
                          <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-white/5 group-hover:border-white/20 transition-all">
                            <img
                              src={film.plakat_url || `https://placehold.co/200x300/111/222?text=${encodeURIComponent(film.tytul)}`}
                              alt={film.tytul}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={e => { e.target.src = `https://placehold.co/200x300/111/222?text=${encodeURIComponent(film.tytul)}`; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/>
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <div className="text-xs font-bold text-white leading-tight">{film.tytul}</div>
                              {film.rok_produkcji && <div className="text-white/40 text-xs">{film.rok_produkcji}</div>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
