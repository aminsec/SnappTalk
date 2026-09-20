import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Input, Button, ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import defaultAvatar from '@/shared/assets/images/avatar.png';
import styles from './NewConversationModal.module.css';

function NewConversationModal({ isOpen, onClose, onSelectUser }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAvailableUsers = useCallback(async (query = '') => {
    const trimmed = query.trim();
    if (!trimmed) {
      setUsers([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, and underscores.');
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchTerm = encodeURIComponent(trimmed);
      const response = await fetch(`/api/v1/members/${searchTerm}/search`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const allUsers = data.members_info || data || [];
        const currentUserId = (user?._id || user?.id)?.toString();
        const availableUsers = allUsers.filter((userItem) => {
          const userId = (userItem._id || userItem.id)?.toString();
          return userId && userId !== currentUserId;
        });

        setUsers(availableUsers);
      } else {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.message || 'Unable to find users.');
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Something went wrong. Please try again.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setUsers([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchAvailableUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, fetchAvailableUsers]);

  const handleUserSelect = useCallback((selectedUser) => {
    if (onSelectUser) {
      onSelectUser(selectedUser);
    }
    onClose();
  }, [onSelectUser, onClose]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>New Conversation</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.searchContainer}>
            <div className={styles.searchBar}>
              <Input
                type="text"
                placeholder="Search by username..."
                icon={faSearch}
                size="md"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {isLoading && (
                <div
                  className={styles.inlineSpinner}
                  role="status"
                  aria-label="Loading users"
                />
              )}
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.usersList}>
            {users.length === 0 ? (
              <div className={styles.emptyState}>
                <p>
                  {isLoading
                    ? 'Searching users...'
                    : searchQuery.trim()
                    ? 'No users found matching your search.'
                    : 'Type a username to find people on SnappTalk.'}
                </p>
              </div>
            ) : (
              users.map((userItem) => (
                <div
                  key={userItem._id || userItem.id}
                  className={styles.userItem}
                  onClick={() => handleUserSelect(userItem)}
                >
                  <ProfileAvatar
                    size="md"
                    src={userItem.profile_pic || defaultAvatar}
                  />
                  <div className={styles.userInfo}>
                    <h3 className={styles.username}>{userItem.username}</h3>
                    {userItem.bio && (
                      <p className={styles.userBio}>{userItem.bio}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewConversationModal;

