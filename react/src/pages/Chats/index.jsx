import styles from './Chat.module.css';
import { Sidebar, Input, Button, ProfileAvatar } from '@/components';

function ChatPage() {
    return (
        <div className={styles.noChatSelected}>
            <h2>Select a chat to start messaging</h2>
        </div>
    );
}

export default ChatPage;