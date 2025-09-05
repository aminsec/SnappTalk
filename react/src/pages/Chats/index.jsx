import { useState, navigate } from 'react';

import styles from './Chat.module.css';
import { Sidebar, Input, Button, ProfileAvatar } from '@/components';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPaperPlane, faCheckDouble, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';

import defaultAvatar from '@/assets/images/avatar.png';

// Fake chat data
const FAKE_CHATS = Array(3).fill(null).map((_, i) => ({
    id: i + 1,
    username: `User ${i + 1}`,
    avatar: defaultAvatar,
    notificationCount: Math.floor(Math.random() * 5),
    lastMessage: (() => {
        const date = new Date(Date.now() - Math.random() * 10000000);
        return {
            text: `Last message from chat ${i + 1}...`,
            seen: Math.random() > 0.5,
            timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            _fullTimestamp: date
        };
    })(),
    messages: Array(30).fill(null).map((_, j) => {
        const date = new Date(Date.now() - Math.random() * 10000000);
        return {
            id: j,
            sender: Math.random() > 0.5 ? 'me' : 'them',
            text: `This is message ${j + 1} in chat ${i + 1}`,
            timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            _fullTimestamp: date 
        };
    })
}));

function ChatPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);

    const filteredChats = FAKE_CHATS.filter(chat =>
        chat.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.chatsPageContainer}>
            <Sidebar className={styles.sidebar} />

            <aside className={styles.chatListSidebar}>
                <div className={styles.searchContainer}>
                    <Input
                        type="text"
                        name="text"
                        id="search"
                        placeholder="Search..."
                        icon={faSearch}
                        size="lg"
                        fullWidth
                        className="mb-3"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className={styles.chatList}>
                    {filteredChats.map(chat => (
                        <div
                            key={chat.id}
                            className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.active : ''}`}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <ProfileAvatar
                                size="md"
                                alt={chat.username}
                            />
                            <div className={styles.chatInfo}>
                                <div className={styles.chatInfoHeader}>
                                    <h3>{chat.username}</h3>
                                    <p className={styles.lastMessage}>{chat.lastMessage.text}</p>
                                </div>
                                <div className={styles.chatInfoFooter}>
                                    <span className={styles.timestamp}>
                                        {chat.lastMessage.timestamp}
                                    </span>
                                    {chat.lastMessage.seen ? (
                                        <span className={styles.seenIcon}>
                                            <FontAwesomeIcon icon={faCheckDouble} />
                                        </span>
                                    ) : (
                                        <span className={styles.notificationBadge}>
                                            <p>{chat.notificationCount}</p>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            <div className={styles.noChatSelected}>
                <h2>Select a chat to start messaging</h2>
            </div>
        </div>
    );
}

export default ChatPage;