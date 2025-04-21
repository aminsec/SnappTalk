import { Link } from 'react-router-dom';

import './assets/css/style.css'
import './assets/css/404.css';

const channels = [
  { icon: '🎮', title: 'Gamers Hub', desc: 'Live streams & reviews' },
  { icon: '🎧', title: 'Music Vibes', desc: 'Chill playlists daily' },
  { icon: '🌐', title: 'World News', desc: 'Stay updated globally' },
  { icon: '🎨', title: 'Creative Minds', desc: 'Designs, art & more' },
];

export default function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-main">
        <h1>404</h1>
        <p className="headline">Page not found</p>
        <p className="subtext">
          The page you’re looking for might have been removed or moved.
          Meanwhile, check out these popular channels!
        </p>
        <Link to="/" className="btn btn-md">Back to Home</Link>
      </div>

      <section className="popular-channels">
        <h2>🔥 Popular Channels</h2>
        <div className="channel-grid">
          {channels.map((ch, i) => (
            <div className="channel-card" key={i}>
              <div className="channel-icon">{ch.icon}</div>
              <h3>{ch.title}</h3>
              <p>{ch.desc}</p>
              <button className='btn btn-sm'>Subscribe</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
