import { useEffect, useState } from 'react';
import { getTelegramUser } from '../utils/telegram';
import './TelegramWarning.css';

export default function TelegramWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check if we're running in Telegram
    const user = getTelegramUser();
    if (!user && window.location.hostname !== 'localhost') {
      setShowWarning(true);
    }
  }, []);

  if (!showWarning) return null;

  return (
    <div className="telegram-warning">
      <div className="warning-content">
        <h3>⚠️ Not Running in Telegram</h3>
        <p>
          This app is designed to run inside Telegram. To test it properly:
        </p>
        <ol>
          <li>Start ngrok: <code>ngrok http 3000</code></li>
          <li>Configure your bot in @BotFather with the ngrok URL</li>
          <li>Open your bot in Telegram</li>
          <li>Click "Open App" button</li>
        </ol>
        <p className="warning-note">
          See <code>TESTING_IN_TELEGRAM.md</code> for detailed instructions.
        </p>
        <button onClick={() => setShowWarning(false)}>Got it</button>
      </div>
    </div>
  );
}

