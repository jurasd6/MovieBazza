import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function MovieDetails({ user }) {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [cast, setCast] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviewForm, setReviewForm] = useState({ ocena: 10, tresc: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchMovie();
    fetchReviews();
    fetchCast();
    fetchDirectors();
  }, [id]);

  async function fetchMovie() {
    const { data } = await supabase
      .from('filmy')
      .select('*, gatunki_filmow ( gatunki ( nazwa ) )')
      .eq('id', id)
      .single();
    setMovie(data);
    setLoading(false);
  }

  async function fetchReviews() {
    const { data } = await supabase
      .from('recenzje')
      .select('*, uzytkownicy (login)')
      .eq('id_filmu', id)
      .order('data_dodania', { ascending: false });
    setReviews(data || []);
  }

  async function fetchCast() {
    const { data } = await supabase
      .from('obsada')
      .select('nazwa_postaci, aktorzy ( id, imie_nazwisko, zdjecie_url )')
      .eq('id_filmu', id);
    setCast(data || []);
  }

  async function fetchDirectors() {
    const { data } = await supabase
      .from('rezyserzy_filmow')
      .select('rezyserzy ( id, imie_nazwisko )')
      .eq('id_filmu', id);
    setDirectors(data || []);
  }

  async function handleSubmitReview() {
    setSubmitError('');
    if (!reviewForm.tresc.trim()) { setSubmitError('Treść recenzji nie może być pusta'); return; }
    setSubmitLoading(true);
    const { error } = await supabase.from('recenzje').insert({
      id_filmu: parseInt(id),
      id_uzytkownika: user.id,
      ocena: parseInt(reviewForm.ocena),
      tresc: reviewForm.tresc
    });
    if (error) { setSubmitError(error.message); }
    else { setReviewForm({ ocena: 10, tresc: '' }); fetchReviews(); }
    setSubmitLoading(false);
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.ocena, 0) / reviews.length).toFixed(1)
    : null;

  const ratingColor = (r) => r >= 8 ? 'text-emerald-400' : r >= 6 ? 'text-yellow-400' : 'text-orange-400';

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin"/>
    </div>
  );
  if (!movie) return (
    <div className="text-center py-32 text-white/30">
      <div className="text-5xl mb-4">🎬</div>
      <div>Nie znaleziono filmu.</div>
    </div>
  );

  const genres = movie.gatunki_filmow?.map(gf => gf.gatunki?.nazwa).filter(Boolean) || [];

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-14">

      {/* WRÓĆ */}
      <Link to="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white mb-10 transition-colors text-sm no-underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Wróć do filmów
      </Link>

      {/* ── HERO FILMU ── */}
      <div className="flex flex-col md:flex-row gap-10 mb-14">
        {/* PLAKAT */}
        <div className="shrink-0">
          <img
            src={movie.plakat_url || `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`}
            alt={movie.tytul}
            className="w-full md:w-[260px] rounded-2xl object-cover shadow-2xl shadow-black/60"
            onError={e => { e.target.src = `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`; }}
          />
        </div>

        {/* INFO */}
        <div className="flex-1 flex flex-col justify-end">
          {/* Gatunki */}
          {genres.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {genres.map(g => (
                <span key={g} className="text-xs font-semibold text-[#e50914] bg-[#e50914]/10 border border-[#e50914]/20 px-3 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-3">{movie.tytul}</h1>

          {/* Meta: rok, reżyser, ocena */}
          <div className="flex items-center gap-4 text-white/40 text-sm mb-6 flex-wrap">
            {movie.rok_produkcji && (
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {movie.rok_produkcji}
              </span>
            )}
            {directors.length > 0 && (
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                {directors.map(d => d.rezyserzy?.imie_nazwisko).filter(Boolean).join(', ')}
              </span>
            )}
            {avgRating && (
              <span className={`flex items-center gap-1.5 font-bold text-base ${ratingColor(parseFloat(avgRating))}`}>
                ★ {avgRating}
                <span className="text-white/30 text-xs font-normal">({reviews.length} {reviews.length === 1 ? 'recenzja' : 'recenzji'})</span>
              </span>
            )}
          </div>

          {/* OPIS */}
          <p className="text-white/60 leading-relaxed text-base max-w-2xl">
            {movie.opis || 'Brak opisu dla tego filmu.'}
          </p>
        </div>
      </div>

      {/* ── OBSADA ── */}
      {cast.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1 h-7 bg-[#e50914] rounded-full"/>
            <h2 className="text-xl font-black uppercase tracking-wide">Obsada</h2>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-3 [scrollbar-width:none]">
            {cast.map((c, i) => (
              <div key={i} className="min-w-[110px] text-center group cursor-pointer flex flex-col items-center">
                <div className="relative mb-3">
                  <img
                    src={c.aktorzy?.zdjecie_url || 'https://placehold.co/200x200/111/222?text=?'}
                    alt={c.aktorzy?.imie_nazwisko}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white/8 group-hover:border-[#e50914]/50 transition-all duration-300"
                    onError={e => { e.target.src = 'https://placehold.co/200x200/111/222?text=?'; }}
                  />
                </div>
                <div className="text-xs font-bold text-white/80 group-hover:text-white transition-colors leading-tight">
                  {c.aktorzy?.imie_nazwisko}
                </div>
                {c.nazwa_postaci && (
                  <div className="text-xs text-white/30 mt-0.5 italic">{c.nazwa_postaci}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-14"/>

      {/* ── RECENZJE ── */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-1 h-7 bg-[#e50914] rounded-full"/>
          <h2 className="text-xl font-black uppercase tracking-wide">
            Recenzje {reviews.length > 0 && <span className="text-white/30 font-normal">({reviews.length})</span>}
          </h2>
        </div>

        {/* FORMULARZ */}
        {user ? (
          <div className="bg-white/3 border border-white/8 p-6 rounded-2xl mb-8">
            <h3 className="font-bold mb-5 text-white/80">Twoja recenzja</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/40">Ocena:</span>
                <div className="flex gap-1">
                  {[...Array(10)].map((_, i) => {
                    const val = i + 1;
                    return (
                      <button key={val}
                        onClick={() => setReviewForm(f => ({ ...f, ocena: val }))}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border-none cursor-pointer
                          ${reviewForm.ocena >= val ? 'bg-[#e50914] text-white' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'}`}>
                        {val}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[#e50914] font-black">{reviewForm.ocena}/10</span>
              </div>
              <textarea
                placeholder="Co sądzisz o tym filmie?..."
                value={reviewForm.tresc}
                onChange={e => setReviewForm(f => ({ ...f, tresc: e.target.value }))}
                className="w-full bg-white/5 border border-white/8 text-white placeholder-white/20 px-4 py-3 rounded-xl min-h-[100px] outline-none focus:border-[#e50914]/50 resize-none transition-colors text-sm"
              />
              {submitError && <div className="text-[#e50914] text-xs">{submitError}</div>}
              <button onClick={handleSubmitReview} disabled={submitLoading}
                className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-40 text-white font-bold py-2.5 px-6 rounded-xl self-start transition-colors text-sm">
                {submitLoading ? 'Publikowanie...' : 'Opublikuj recenzję'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/3 border border-white/8 p-6 rounded-2xl mb-8 text-center text-white/30 text-sm">
            <Link to="/" className="text-[#e50914] hover:underline">Zaloguj się</Link>, aby dodać recenzję.
          </div>
        )}

        {/* LISTA RECENZJI */}
        <div className="flex flex-col gap-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-white/20">
              <div className="text-4xl mb-3">💬</div>
              <div className="text-sm">Nikt jeszcze nie ocenił tego filmu. Bądź pierwszy!</div>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-white/3 border border-white/5 p-5 rounded-xl flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center font-black text-sm shrink-0">
                  {review.uzytkownicy?.login ? review.uzytkownicy.login.slice(0, 2).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-sm text-white/90">{review.uzytkownicy?.login || 'Anonim'}</span>
                    <span className={`font-black text-sm ${ratingColor(review.ocena)}`}>★ {review.ocena}/10</span>
                    <span className="text-white/25 text-xs">{new Date(review.data_dodania).toLocaleDateString('pl-PL')}</span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">{review.tresc}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
