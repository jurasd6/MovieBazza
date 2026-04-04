import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ActorDetails() {
  const { id } = useParams();
  const [actor, setActor] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActor();
    fetchMovies();
  }, [id]);

  async function fetchActor() {
    const { data } = await supabase
      .from('aktorzy')
      .select('id, imie_nazwisko, zdjecie_url')
      .eq('id', id)
      .single();
    setActor(data);
  }

  async function fetchMovies() {
    const { data } = await supabase
      .from('obsada')
      .select('nazwa_postaci, filmy ( id, tytul, rok_produkcji, plakat_url, opis )')
      .eq('id_aktora', id)
      .order('id');
    setMovies(data || []);
    setLoading(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin"/>
    </div>
  );

  if (!actor) return (
    <div className="text-center py-32 text-white/30">
      <div className="text-5xl mb-4">🎭</div>
      <div>Nie znaleziono aktora.</div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-14">

      {/* WRÓĆ */}
      <Link to="/aktorzy" className="inline-flex items-center gap-2 text-white/30 hover:text-white mb-10 transition-colors text-sm no-underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Wróć do aktorów
      </Link>

      {/* ── PROFIL AKTORA ── */}
      <div className="flex flex-col sm:flex-row gap-10 mb-16 items-start">
        <div className="shrink-0">
          <img
            src={actor.zdjecie_url || 'https://placehold.co/300x300/111/222?text=?'}
            alt={actor.imie_nazwisko}
            className="w-44 h-44 rounded-full object-cover border-4 border-white/8 shadow-2xl shadow-black/60"
            onError={e => { e.target.src = 'https://placehold.co/300x300/111/222?text=?'; }}
          />
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-[#e50914] text-xs font-semibold tracking-widest uppercase mb-3">Aktor</div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">{actor.imie_nazwisko}</h1>
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>
            </svg>
            {movies.length} {movies.length === 1 ? 'film' : movies.length < 5 ? 'filmy' : 'filmów'} w bazie
          </div>
        </div>
      </div>

      {/* ── FILMOGRAFIA ── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-7 bg-[#e50914] rounded-full"/>
        <h2 className="text-xl font-black uppercase tracking-wide">Filmografia</h2>
      </div>

      {movies.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <div className="text-4xl mb-3">🎬</div>
          <div className="text-sm">Brak filmów dla tego aktora w bazie.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {movies.map((entry, i) => {
            const film = entry.filmy;
            if (!film) return null;
            return (
              <Link
                key={i}
                to={`/film/${film.id}`}
                className="group relative bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 no-underline block"
              >
                <div className="relative w-full aspect-[2/3] overflow-hidden">
                  <img
                    src={film.plakat_url || `https://placehold.co/500x750/111/222?text=${encodeURIComponent(film.tytul)}`}
                    alt={film.tytul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.src = `https://placehold.co/500x750/111/222?text=${encodeURIComponent(film.tytul)}`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"/>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-bold leading-tight text-white">{film.tytul}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {film.rok_produkcji && (
                        <span className="text-white/40 text-xs">{film.rok_produkcji}</span>
                      )}
                      {entry.nazwa_postaci && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20"/>
                          <span className="text-[#e50914]/80 text-xs italic">{entry.nazwa_postaci}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
