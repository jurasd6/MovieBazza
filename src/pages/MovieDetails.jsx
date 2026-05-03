import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function MovieDetails({ user, toast }) {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [cast, setCast] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [comments, setComments] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});

  const [reviewForm, setReviewForm] = useState({ ocena: 10, tresc: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => { fetchMovie(); fetchReviews(); fetchCast(); fetchDirectors(); }, [id]);
  useEffect(() => { if (user) fetchFavoriteStatus(); else setIsFav(false); }, [user, id]);

  async function fetchMovie() {
    const { data } = await supabase.from('filmy').select('*, gatunki_filmow ( gatunki ( nazwa ) )').eq('id', id).single();
    setMovie(data); setLoading(false);
  }

  async function fetchReviews() {
    const { data } = await supabase.from('recenzje').select('*, uzytkownicy (login), komentarze (id)').eq('id_filmu', id).order('data_dodania', { ascending: false });
    setReviews(data || []);
  }

  async function fetchCast() {
    const { data } = await supabase.from('obsada').select('nazwa_postaci, aktorzy ( id, imie_nazwisko, zdjecie_url )').eq('id_filmu', id);
    setCast(data || []);
  }

  async function fetchDirectors() {
    const { data } = await supabase.from('rezyserzy_filmow').select('rezyserzy ( id, imie_nazwisko )').eq('id_filmu', id);
    setDirectors(data || []);
  }

  async function fetchFavoriteStatus() {
    const { data } = await supabase.from('ulubione').select('id').eq('id_uzytkownika', user.id).eq('id_filmu', id).single();
    setIsFav(!!data);
  }

  async function toggleFavorite() {
    if (!user || favLoading) return;
    setFavLoading(true);
    if (isFav) {
      await supabase.from('ulubione').delete().eq('id_uzytkownika', user.id).eq('id_filmu', id);
      setIsFav(false);
      toast?.('Usunięto z ulubionych', 'info');
    } else {
      await supabase.from('ulubione').insert({ id_uzytkownika: user.id, id_filmu: parseInt(id) });
      setIsFav(true);
      toast?.('Dodano do ulubionych! ❤️', 'success');
    }
    setFavLoading(false);
  }

  async function fetchComments(reviewId) {
    const { data } = await supabase.from('komentarze').select('*, uzytkownicy (login)').eq('id_recenzji', reviewId).order('data_dodania', { ascending: true });
    setComments(prev => ({ ...prev, [reviewId]: data || [] }));
  }

  function toggleComments(reviewId) {
    const isOpen = openComments[reviewId];
    setOpenComments(prev => ({ ...prev, [reviewId]: !isOpen }));
    if (!isOpen && !comments[reviewId]) fetchComments(reviewId);
  }

  async function handleAddComment(reviewId) {
    const tresc = commentInputs[reviewId]?.trim();
    if (!tresc || !user) return;
    setCommentLoading(prev => ({ ...prev, [reviewId]: true }));
    await supabase.from('komentarze').insert({ id_recenzji: reviewId, id_uzytkownika: user.id, tresc });
    setCommentInputs(prev => ({ ...prev, [reviewId]: '' }));
    await fetchComments(reviewId);
    setCommentLoading(prev => ({ ...prev, [reviewId]: false }));
    toast?.('Komentarz dodany!', 'success');
  }

  async function handleSubmitReview() {
    setSubmitError('');
    if (!reviewForm.tresc.trim()) { setSubmitError('Treść recenzji nie może być pusta'); return; }
    setSubmitLoading(true);
    const { error } = await supabase.from('recenzje').insert({
      id_filmu: parseInt(id), id_uzytkownika: user.id,
      ocena: parseInt(reviewForm.ocena), tresc: reviewForm.tresc
    });
    if (error) { setSubmitError(error.message); }
    else { setReviewForm({ ocena: 10, tresc: '' }); fetchReviews(); toast?.('Recenzja opublikowana!', 'success'); }
    setSubmitLoading(false);
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.ocena, 0) / reviews.length).toFixed(1) : null;
  const ratingColor = (r) => r >= 8 ? 'text-emerald-400' : r >= 6 ? 'text-yellow-400' : 'text-orange-400';

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin"/></div>;
  if (!movie) return <div className="text-center py-32 text-white/30"><div className="text-5xl mb-4">🎬</div><div>Nie znaleziono filmu.</div></div>;

  const genres = movie.gatunki_filmow?.map(gf => gf.gatunki?.nazwa).filter(Boolean) || [];

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-14">

      <Link to="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white mb-10 transition-colors text-sm no-underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        Wróć do filmów
      </Link>

      {/* HERO */}
      <div className="flex flex-col md:flex-row gap-10 mb-14">
        <div className="shrink-0">
          <img src={movie.plakat_url || `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`} alt={movie.tytul}
            className="w-full md:w-[260px] rounded-2xl object-cover shadow-2xl shadow-black/60"
            onError={e => { e.target.src = `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`; }} />
        </div>
        <div className="flex-1 flex flex-col justify-end">
          {genres.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {genres.map(g => <span key={g} className="text-xs font-semibold text-[#e50914] bg-[#e50914]/10 border border-[#e50914]/20 px-3 py-1 rounded-full">{g}</span>)}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-3">{movie.tytul}</h1>
          <div className="flex items-center gap-4 text-white/40 text-sm mb-6 flex-wrap">
            {movie.rok_produkcji && <span className="flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{movie.rok_produkcji}</span>}
            {directors.length > 0 && <span className="flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>{directors.map(d => d.rezyserzy?.imie_nazwisko).filter(Boolean).join(', ')}</span>}
            {avgRating && <span className={`flex items-center gap-1.5 font-bold text-base ${ratingColor(parseFloat(avgRating))}`}>★ {avgRating}<span className="text-white/30 text-xs font-normal">({reviews.length} {reviews.length === 1 ? 'recenzja' : 'recenzji'})</span></span>}
          </div>
          <p className="text-white/60 leading-relaxed text-base max-w-2xl mb-8">{movie.opis || 'Brak opisu dla tego filmu.'}</p>
          {user && (
            <button onClick={toggleFavorite} disabled={favLoading}
              className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border self-start cursor-pointer
                ${isFav ? 'bg-[#e50914] border-[#e50914] text-white shadow-lg shadow-red-900/30 hover:bg-[#cc0812]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20'}
                ${favLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {isFav ? 'W ulubionych' : 'Dodaj do ulubionych'}
            </button>
          )}
        </div>
      </div>

      {/* OBSADA */}
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
                  <img src={c.aktorzy?.zdjecie_url || 'https://placehold.co/200x200/111/222?text=?'} alt={c.aktorzy?.imie_nazwisko}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white/8 group-hover:border-[#e50914]/50 transition-all duration-300"
                    onError={e => { e.target.src = 'https://placehold.co/200x200/111/222?text=?'; }} />
                </div>
                <div className="text-xs font-bold text-white/80 group-hover:text-white transition-colors leading-tight">{c.aktorzy?.imie_nazwisko}</div>
                {c.nazwa_postaci && <div className="text-xs text-white/30 mt-0.5 italic">{c.nazwa_postaci}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-14"/>

      {/* RECENZJE */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-1 h-7 bg-[#e50914] rounded-full"/>
          <h2 className="text-xl font-black uppercase tracking-wide">Recenzje {reviews.length > 0 && <span className="text-white/30 font-normal">({reviews.length})</span>}</h2>
        </div>

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
                      <button key={val} onClick={() => setReviewForm(f => ({ ...f, ocena: val }))}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${reviewForm.ocena >= val ? 'bg-[#e50914] text-white' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'}`}>
                        {val}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[#e50914] font-black">{reviewForm.ocena}/10</span>
              </div>
              <textarea placeholder="Co sądzisz o tym filmie?..." value={reviewForm.tresc}
                onChange={e => setReviewForm(f => ({ ...f, tresc: e.target.value }))}
                className="w-full bg-white/5 border border-white/8 text-white placeholder-white/20 px-4 py-3 rounded-xl min-h-[100px] outline-none focus:border-[#e50914]/50 resize-none transition-colors text-sm" />
              {submitError && <div className="text-[#e50914] text-xs">{submitError}</div>}
              <button onClick={handleSubmitReview} disabled={submitLoading}
                className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-40 text-white font-bold py-2.5 px-6 rounded-xl self-start transition-colors text-sm border-none cursor-pointer">
                {submitLoading ? 'Publikowanie...' : 'Opublikuj recenzję'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/3 border border-white/8 p-6 rounded-2xl mb-8 text-center text-white/30 text-sm">Zaloguj się, aby dodać recenzję.</div>
        )}

        <div className="flex flex-col gap-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-white/20">
              <div className="text-4xl mb-3">💬</div>
              <div className="text-sm">Nikt jeszcze nie ocenił tego filmu. Bądź pierwszy!</div>
            </div>
          ) : reviews.map(review => (
            <div key={review.id} className="bg-white/3 border border-white/5 rounded-xl overflow-hidden">
              <div className="p-5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center font-black text-sm shrink-0">
                  {review.uzytkownicy?.login ? review.uzytkownicy.login.slice(0, 2).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-sm text-white/90">{review.uzytkownicy?.login || 'Anonim'}</span>
                    <span className={`font-black text-sm ${ratingColor(review.ocena)}`}>★ {review.ocena}/10</span>
                    <span className="text-white/25 text-xs">{new Date(review.data_dodania).toLocaleDateString('pl-PL')}</span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed mb-3">{review.tresc}</p>
                  <button onClick={() => toggleComments(review.id)}
                    className="flex items-center gap-1.5 text-white/30 hover:text-white text-xs transition-colors border-none bg-transparent cursor-pointer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {openComments[review.id] ? 'Ukryj komentarze' : `Wyświetl komentarze (${comments[review.id]?.length ?? review.komentarze?.length ?? 0})`}
                  </button>
                </div>
              </div>

              {openComments[review.id] && (
                <div className="border-t border-white/5 bg-black/20 px-5 py-4">
                  <div className="flex flex-col gap-3 mb-4">
                    {!(comments[review.id]?.length) ? (
                      <div className="text-white/20 text-xs py-1">Brak komentarzy. Bądź pierwszy!</div>
                    ) : comments[review.id].map(c => (
                      <div key={c.id} className="flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                          {c.uzytkownicy?.login ? c.uzytkownicy.login.slice(0,2).toUpperCase() : '?'}
                        </div>
                        <div>
                          <span className="text-white/60 text-xs font-bold mr-2">{c.uzytkownicy?.login || 'Anonim'}</span>
                          <span className="text-white/30 text-xs">{new Date(c.data_dodania).toLocaleDateString('pl-PL')}</span>
                          <p className="text-white/60 text-xs mt-0.5">{c.tresc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {user ? (
                    <div className="flex gap-2">
                      <input type="text" placeholder="Napisz komentarz..."
                        value={commentInputs[review.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [review.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(review.id)}
                        className="flex-1 bg-white/5 border border-white/8 text-white placeholder-white/20 px-3 py-2 rounded-lg text-xs outline-none focus:border-[#e50914]/50 transition-colors" />
                      <button onClick={() => handleAddComment(review.id)} disabled={commentLoading[review.id]}
                        className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors border-none cursor-pointer">
                        {commentLoading[review.id] ? '...' : 'Wyślij'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-white/20 text-xs">Zaloguj się, aby skomentować.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
