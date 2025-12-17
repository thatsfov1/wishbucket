import { TelegramUser } from '../types';
import './Avatar.css';

interface AvatarProps {
  user: TelegramUser | null;
  size?: 'small' | 'medium' | 'large';
  showOnline?: boolean;
}

export default function Avatar({ user, size = 'medium', showOnline = false }: AvatarProps) {
  if (!user) {
    return (
      <div className={`avatar avatar-${size} avatar-placeholder`}>
        <span>?</span>
      </div>
    );
  }

  const initials = user.first_name?.[0]?.toUpperCase() || 'U';
  const fullName = `${user.first_name} ${user.last_name || ''}`.trim();

  return (
    <div className={`avatar avatar-${size}`}>
      {user.photo_url ? (
        <img 
          src={user.photo_url} 
          alt={fullName}
          className="avatar-image"
        />
      ) : (
        <div className="avatar-initials">
          {initials}
        </div>
      )}
      {showOnline && <span className="avatar-online-indicator" />}
    </div>
  );
}

