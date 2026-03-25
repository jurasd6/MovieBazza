import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function MovieDetails({ user }) {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formularz recenzji
  const [reviewForm, setReviewForm] = useState({ ocena: 10, tresc: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchMovie();
    fetchReviews();
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
    const { data, error } = await supabase
      .from('recenzje')
      .select('*, uzytkownicy (login)')
      .eq('id_filmu', id)
      .order('data_dodania', { ascending: false });
      
    if (error) console.error('Błąd:', error.message);
    setReviews(data || []);
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

    if (error) {
      setSubmitError(error.message);
    } else {
      setReviewForm({ ocena: 10, tresc: '' });
      fetchReviews(); // Odświeżamy listę po dodaniu
    }
    setSubmitLoading(false);
  }

  if (loading) return <div className="text-center py-32 text-white/50">Ładowanie filmu...</div>;
  if (!movie) return <div className="text-center py-32 text-white/50">Nie znaleziono filmu.</div>;

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-14">
      <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Wróć do listy filmów
      </Link>

      {/* GŁÓWNE INFO O FILMIE */}
      <div className="flex flex-col md:flex-row gap-10 bg-white/5 border border-white/10 p-8 rounded-2xl mb-12">
        <img 
          src={movie.plakat_url || `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`} 
          alt={movie.tytul} 
          className="w-full md:w-[300px] rounded-xl object-cover shadow-2xl"
          onError={e => { e.target.src = `https://placehold.co/500x750/111/222?text=${encodeURIComponent(movie.tytul)}`; }}
        />
        <div className="flex-1">
          <h1 className="text-5xl font-black mb-2">{movie.tytul}</h1>
          <div className="flex gap-4 text-white/50 text-sm mb-6 font-medium">
            {movie.rok_produkcji && <span>{movie.rok_produkcji}</span>}
            {movie.gatunki_filmow?.length > 0 && (
              <span className="text-[#e50914]">{movie.gatunki_filmow.map(gf => gf.gatunki?.nazwa).join(', ')}</span>
            )}
          </div>
          <p className="text-white/70 leading-relaxed text-lg">{movie.opis || 'Brak opisu dla tego filmu.'}</p>
        </div>
      </div>

      {/* SEKCJA RECENZJI */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-8 bg-[#e50914] rounded-full"/>
        <h2 className="text-2xl font-black uppercase tracking-wide">Recenzje ({reviews.length})</h2>
      </div>

      {/* DODAWANIE RECENZJI */}
      {user ? (
        <div className="bg-[#111] border border-white/10 p-6 rounded-xl mb-10">
          <h3 className="font-bold text-lg mb-4">Dodaj swoją recenzję</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm text-white/50">Twoja ocena:</label>
              <select 
                value={reviewForm.ocena} 
                onChange={e => setReviewForm(f => ({ ...f, ocena: e.target.value }))}
                className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg outline-none focus:border-[#e50914]"
              >
                {[...Array(10)].map((_, i) => <option key={i+1} value={10-i} className="text-black">{10-i} / 10</option>)}
              </select>
            </div>
            <textarea 
              placeholder="Co sądzisz o tym filmie?..." 
              value={reviewForm.tresc}
              onChange={e => setReviewForm(f => ({ ...f, tresc: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 rounded-xl min-h-[100px] outline-none focus:border-[#e50914] resize-none transition-colors"
            />
            {submitError && <div className="text-[#e50914] text-sm">{submitError}</div>}
            <button 
              onClick={handleSubmitReview} 
              disabled={submitLoading}
              className="bg-[#e50914] hover:bg-[#f01020] disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl self-start transition-colors"
            >
              {submitLoading ? 'Dodawanie...' : 'Opublikuj recenzję'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl mb-10 text-center text-white/50">
          Musisz się zalogować, aby dodać recenzję.
        </div>
      )}

      {/* LISTA RECENZJI */}
      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-white/30">Nikt jeszcze nie ocenił tego filmu. Bądź pierwszy!</div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white/5 border border-white/5 p-6 rounded-xl flex gap-5">
              <div className="w-12 h-12 rounded-full bg-[#e50914] flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-red-900/20">
                {review.uzytkownicy?.login ? review.uzytkownicy.login.slice(0,2).toUpperCase() : '?'}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-white/90">{review.uzytkownicy?.login || 'Anonim'}</span>
                  <span className="text-[#e50914] font-black bg-[#e50914]/10 px-2 py-0.5 rounded text-sm">{review.ocena}/10</span>
                  <span className="text-white/30 text-xs">{new Date(review.data_dodania).toLocaleDateString('pl-PL')}</span>
                </div>
                <p className="text-white/70 leading-relaxed text-sm">{review.tresc}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}