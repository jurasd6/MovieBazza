import { useState } from 'react'
import './App.css'

function App() {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('movie');

  const movies = [
    { id: 1, title: "Gladiator II", genre: "Akcja", rating: 8.5, img: "https://image.tmdb.org/t/p/w500/q719jXXLsU9P6uuzHwbiuxtccC8.jpg" },
    { id: 2, title: "Joker: Folie à Deux", genre: "Dramat", rating: 6.2, img: "https://image.tmdb.org/t/p/w500/8cdcl36ZGb9v6p6An9p677Yf6S.jpg" },
    { id: 3, title: "The Batman", genre: "Kryminał", rating: 9.0, img: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLv1oYI8fs.jpg" },
    { id: 4, title: "Dune: Part Two", genre: "Sci-Fi", rating: 8.8, img: "https://image.tmdb.org/t/p/w500/mS9u0S2l0l5N8iBqW6Vv6W4Wl2z.jpg" },
    { id: 5, title: "Interstellar", genre: "Sci-Fi", rating: 9.5, img: "https://image.tmdb.org/t/p/w500/gEU2QvE6ZSHuYvC9pxC6f1vSfBn.jpg" },
    { id: 6, title: "Incepcja", genre: "Akcja", rating: 8.8, img: "https://image.tmdb.org/t/p/w500/edv5uSjSNIcJuS1YpkpXvwhhpRz.jpg" },
  ];

  const actors = [
    { id: 1, name: "Paul Mescal", role: "Lucius", img: "https://image.tmdb.org/t/p/w200/9S7m9uJ38K3n78k9p3vG7p4YF1V.jpg" },
    { id: 2, name: "Joaquin Phoenix", role: "Joker", img: "https://image.tmdb.org/t/p/w200/n8199U9pD7SleA1nQa63FE8y89O.jpg" },
    { id: 3, name: "Robert Pattinson", role: "Bruce Wayne", img: "https://image.tmdb.org/t/p/w200/869f68J8YpE4H9Uo6Vv8YpE4H9U.jpg" },
  ];

  return (
    <div className="full-width-page">
      <nav className="navbar-edge">
        <div className="edge-container nav-content">
          <div className="brand-logo">MOVIE<span>BAZZA</span></div>
          <ul className="links-center">
            <li>Filmy</li>
            <li>Aktorzy</li>
            <li>Gatunki</li>
            <li>Moje Oceny</li>
          </ul>
          <div className="nav-actions">
            <button className="btn-s" onClick={() => {setFormType('actor'); setShowForm(true)}}>+ Aktor</button>
            <button className="btn-p" onClick={() => {setFormType('movie'); setShowForm(true)}}>+ Film</button>
          </div>
        </div>
      </nav>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>{formType === 'movie' ? 'Dodaj Film' : 'Dodaj Aktora'}</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form className="form-body">
              {formType === 'movie' ? (
                <>
                  <input type="text" placeholder="Tytuł filmu" />
                  <textarea placeholder="Opis..."></textarea>
                  <div className="form-row">
                    <select><option>Gatunek</option><option>Akcja</option></select>
                    <input type="number" placeholder="Rok" />
                  </div>
                </>
              ) : (
                <input type="text" placeholder="Imię Nazwisko" />
              )}
              <button type="button" className="btn-submit" onClick={() => setShowForm(false)}>Zapisz</button>
            </form>
          </div>
        </div>
      )}

      <div className="edge-container">
        <header className="hero-section">
          <h1>MovieBazza - Twoja Baza Filmów</h1>
          <div className="stats-grid">
            <div className="stat"><span>{movies.length}</span> Filmy</div>
            <div className="stat"><span>{actors.length}</span> Aktorzy</div>
            <div className="stat"><span>42</span> Recenzje</div>
          </div>
        </header>

        <section className="main-section">
          <div className="section-header">
            <h2 className="title-edge">Najnowsze Filmy</h2>
            <div className="filters">
              <span className="active">Wszystkie</span><span>Akcja</span><span>Dramat</span><span>Sci-Fi</span>
            </div>
          </div>
          <div className="full-grid">
            {movies.map(movie => (
              <div key={movie.id} className="movie-card-edge">
                <div className="img-wrapper">
                  <img src={movie.img} alt={movie.title} />
                  <div className="rating-badge">⭐ {movie.rating}</div>
                </div>
                <div className="movie-info-edge">
                  <h3>{movie.title}</h3>
                  <p>{movie.genre}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="main-section">
          <div className="section-header">
            <h2 className="title-edge">Gwiazdy Kina</h2>
          </div>
          <div className="actors-scroll">
            {actors.map(actor => (
              <div key={actor.id} className="actor-circle-card">
                <img src={actor.img} alt={actor.name} />
                <h4>{actor.name}</h4>
                <span>{actor.role}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App