import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';
import { Input, Button } from '../../components';

const channels = [
  { icon: '🎮', title: 'Gamers Hub', desc: 'Gameplay & reviews' },
  { icon: '🎧', title: 'Music Vibes', desc: 'Chill playlists daily' },
  { icon: '🌐', title: 'World News', desc: 'Breaking news' },
  { icon: '🎨', title: 'Creative Minds', desc: 'Designs, art & more' },
];

export default function NotFound() {
  return (
    <div className={styles['notfound-container']}>
      <div className={styles['notfound-main']}>
        <h1>404</h1>
        <p className={styles.headline}>Page not found</p>
        <p className={styles.subtext}>The page you’re looking for might have been removed or moved.</p>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button size="md">
            Back to Home
          </Button>
        </Link>
      </div>

      <section className={styles['popular-channels']}>
        <h2>Popular Channels</h2>
        <div className={styles['channel-grid']}>
          {channels.map((ch, i) => (
            <div className={styles['channel-card']} key={i}>
              <div className={styles['channel-icon']}>{ch.icon}</div>
              <h3>{ch.title}</h3>
              <p className='mb-2'>{ch.desc}</p>
              <Button size="sm">Subscribe</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
