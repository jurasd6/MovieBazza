import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function MovieDetails({ user }) {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ ocena: 10, tresc: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => { fetchMovie(); fetchReviews(); }, [id]);

  async function fetchMovie() {
    const { data } = await supabase.from('filmy').select('*, gatunki_filmow ( gatunki ( nazwa ) )').eq('id', id).single();
    setMovie(data); setLoading(false);
  }

  async function fetchReviews() {
  const { data } = await supabase
    .from('recenzje')
    .select('*, uzytkownicy (login), komentarze (id)')
    .eq('id_filmu', id)
    .order('data_dodania', { ascending: false });
  setReviews(data || []);
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
  }

  async function handleSubmitReview() {
    setSubmitError('');
    if (!reviewForm.tresc.trim()) { setSubmitError('Treść recenzji nie może być pusta'); return; }
    setSubmitLoading(true);
    const { error } = await supabase.from('recenzje').insert({ id_filmu: parseInt(id), id_uzytkownika: user.id, ocena: parseInt(reviewForm.ocena), tresc: reviewForm.tresc });
    if (error) { setSubmitError(error.message); } else { setReviewForm({ ocena: 10, tresc: '' }); fetchReviews(); }
    setSubmitLoading(false);
  }

  if (loading) return <div className="text-center py-32 text-white/50">Ładowanie...</div>;
  if (!movie) return <div className="text-center py-32 text-white/50">Nie znaleziono filmu.</div>;

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-14">
      <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors no-underline">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Wróć do listy filmów
      </Link>

      <div className="flex flex-col md:flex-row gap-10 bg-white/5 border border-white/10 p-8 rounded-2xl mb-12">
        <img src={movie.plakat_url || `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`} alt={movie.tytul} className="w-full md:w-[300px] rounded-xl object-cover shadow-2xl" onError={e => { e.target.src = `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`; }} />
        <div className="flex-1">
          <h1 className="text-5xl font-black mb-2">{movie.tytul}</h1>
          <div className="flex gap-4 text-white/50 text-sm mb-6 font-medium">
            {movie.rok_produkcji && <span>{movie.rok_produkcji}</span>}
            {movie.gatunki_filmow?.length > 0 && <span className="text-[#e50914]">{movie.gatunki_filmow.map(gf => gf.gatunki?.nazwa).join(', ')}</span>}
          </div>
          <p className="text-white/70 leading-relaxed text-lg">{movie.opis || 'Brak opisu.'}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
        <h2 className="text-2xl font-black uppercase tracking-wide">Recenzje ({reviews.length})</h2>
      </div>

      {user ? (
        <div className="bg-[#111] border border-white/10 p-6 rounded-xl mb-10">
          <h3 className="font-bold text-lg mb-4">Dodaj swoją recenzję</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm text-white/50">Ocena:</label>
              <select value={reviewForm.ocena} onChange={e => setReviewForm(f => ({ ...f, ocena: e.target.value }))} className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg outline-none focus:border-[#e50914]">
                {[...Array(10)].map((_, i) => <option key={i+1} value={10-i} className="text-black">{10-i} / 10</option>)}
              </select>
            </div>
            <textarea placeholder="Co sądzisz o tym filmie?..." value={reviewForm.tresc} onChange={e => setReviewForm(f => ({ ...f, tresc: e.target.value }))} className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 rounded-xl min-h-[100px] outline-none focus:border-[#e50914] resize-none transition-colors" />
            {submitError && <div className="text-[#e50914] text-sm">{submitError}</div>}
            <button onClick={handleSubmitReview} disabled={submitLoading} className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl self-start transition-colors border-none cursor-pointer">
              {submitLoading ? 'Dodawanie...' : 'Opublikuj recenzję'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl mb-10 text-center text-white/50">
          Zaloguj się, aby dodać recenzję.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-white/30">Nikt jeszcze nie ocenił tego filmu. Bądź pierwszy!</div>
        ) : reviews.map(review => (
          <div key={review.id} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
            <div className="p-6 flex gap-5">
              <div className="w-12 h-12 rounded-full bg-[#e50914] flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-red-900/20">
                {review.uzytkownicy?.login ? review.uzytkownicy.login.slice(0,2).toUpperCase() : '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-white/90">{review.uzytkownicy?.login || 'Anonim'}</span>
                  <span className="text-[#e50914] font-black bg-[#e50914]/10 px-2 py-0.5 rounded text-sm">{review.ocena}/10</span>
                  <span className="text-white/30 text-xs">{new Date(review.data_dodania).toLocaleDateString('pl-PL')}</span>
                </div>
                <p className="text-white/70 leading-relaxed text-sm mb-3">{review.tresc}</p>
                <button onClick={() => toggleComments(review.id)}
                  className="flex items-center gap-1.5 text-white/30 hover:text-white text-xs transition-colors border-none bg-transparent cursor-pointer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  {openComments[review.id] ? 'Ukryj komentarze' : `Wyświetl komentarze (${comments[review.id]?.length ?? review.komentarze?.length ?? 0})`}
                </button>
              </div>
            </div>

            {openComments[review.id] && (
              <div className="border-t border-white/5 bg-black/20 px-6 py-4">
                <div className="flex flex-col gap-3 mb-4">
                  {!(comments[review.id]?.length) ? (
                    <div className="text-white/20 text-xs py-2">Brak komentarzy. Bądź pierwszy!</div>
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
    </div>
  );
}
