import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const GENRE_ICONS = {
  'Akcja':      '💥',
  'Animacja':   '🎨',
  'Dramat':     '🎭',
  'Fantasy':    '🧙',
  'Horror':     '👻',
  'Komedia':    '😂',
  'Kryminał':   '🔍',
  'Przygodowy': '🗺️',
  'Romans':     '❤️',
  'Sci-Fi':     '🚀',
  'Thriller':   '😰',
  'Western':    '🤠',
};

export default function Genres() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // aktywny gatunek

  useEffect(() => {
    fetchGenresWithMovies();
  }, []);

  async function fetchGenresWithMovies() {
    // Pobierz gatunki z filmami (przez tabelę łączącą)
    const { data } = await supabase
      .from('gatunki')
      .select(`
        id, nazwa,
        gatunki_filmow (
          filmy ( id, tytul, plakat_url, rok_produkcji )
        )
      `)
      .order('nazwa');

    if (data) {
      // Dla każdego gatunku pobierz też średnią ocen
      const enriched = await Promise.all(data.map(async (g) => {
        const filmIds = g.gatunki_filmow
          .map(gf => gf.filmy?.id)
          .filter(Boolean);

        let avgRating = null;
        if (filmIds.length > 0) {
          const { data: reviews } = await supabase
            .from('recenzje')
            .select('ocena')
            .in('id_filmu', filmIds);
          if (reviews && reviews.length > 0) {
            avgRating = (reviews.reduce((s, r) => s + r.ocena, 0) / reviews.length).toFixed(1);
          }
        }

        const films = g.gatunki_filmow
          .map(gf => gf.filmy)
          .filter(Boolean);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/3 rounded-2xl h-52 animate-pulse"/>
        ))}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {genres.map(genre => (
          <div key={genre.id}>
            {/* KARTA GATUNKU */}
            <button
              onClick={() => setSelected(selected?.id === genre.id ? null : genre)}
              className={`w-full text-left bg-[#111] border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 cursor-pointer
                ${selected?.id === genre.id ? 'border-[#e50914]/50 shadow-lg shadow-[#e50914]/10' : 'border-white/5 hover:border-white/15'}`}
            >
              {/* PASEK PLAKATÓW */}
              <div className="flex h-28 overflow-hidden relative">
                {genre.films.slice(0, 4).map((film, i) => (
                  <div key={film.id} className="flex-1 relative overflow-hidden">
                    <img
                      src={film.plakat_url || `https://placehold.co/200x300/111/222?text=?`}
                      alt={film.tytul}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = 'https://placehold.co/200x300/111/222?text=?'; }}
                    />
                    {/* ciemniejsze przykrycie na każdym kolejnym */}
                    <div className={`absolute inset-0 bg-black/${20 + i * 10}`}/>
                  </div>
                ))}
                {genre.films.length === 0 && (
                  <div className="flex-1 bg-white/3 flex items-center justify-center text-white/10 text-sm">
                    Brak filmów
                  </div>
                )}
                {/* gradient na dole */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"/>
              </div>

              {/* INFO */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{GENRE_ICONS[genre.nazwa] || '🎬'}</span>
                  <div>
                    <div className="font-black text-lg text-white leading-tight">{genre.nazwa}</div>
                    <div className="text-white/30 text-xs mt-0.5">
                      {genre.films.length} {genre.films.length === 1 ? 'film' : genre.films.length < 5 ? 'filmy' : 'filmów'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {genre.avgRating && (
                    <div className="text-right">
                      <div className="text-yellow-400 font-black text-lg">★ {genre.avgRating}</div>
                      <div className="text-white/20 text-xs">śr. ocena</div>
                    </div>
                  )}
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={`text-white/30 transition-transform duration-300 ${selected?.id === genre.id ? 'rotate-180 text-[#e50914]' : ''}`}>
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </button>

            {/* ROZWINIĘTA LISTA FILMÓW */}
            {selected?.id === genre.id && (
              <div className="mt-3 bg-[#0d0d0d] border border-white/5 rounded-2xl p-5">
                {genre.films.length === 0 ? (
                  <div className="text-center py-6 text-white/20 text-sm">Brak filmów w tym gatunku.</div>
                ) : (
                  <>
                    <div className="text-xs text-white/30 uppercase tracking-widest mb-4 font-semibold">
                      Filmy w gatunku {genre.nazwa}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {genre.films.map(film => (
                        <Link
                          key={film.id}
                          to={`/film/${film.id}`}
                          className="group no-underline block"
                        >
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
