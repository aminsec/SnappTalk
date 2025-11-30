import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Input, Button, ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import defaultAvatar from '@/shared/assets/images/avatar.png';
import styles from './NewConversationModal.module.css';

function NewConversationModal({ isOpen, onClose, onSelectUser, existingContacts = [] }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
    } else {
      // Reset state when modal closes
      setSearchQuery('');
      setUsers([]);
      setError(null);
    }
  }, [isOpen]);

  const fetchAvailableUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all users (excluding current user)
      // Note: You need to create this endpoint: GET /api/v1/user/users
      // It should return: { users: Array<ProtectedUserInfo> }
      let response = await fetch('/api/v1/user/users', {
        method: 'GET',
        credentials: 'include',
      });

      // Handle 404 - endpoint doesn't exist yet
      if (response.status === 404) {
        setError('Feature not available yet. The users endpoint needs to be implemented.');
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        let allUsers = data.users || data || [];
        
        // Get IDs of users we already have conversations with
        const existingContactIds = new Set();
        existingContacts.forEach(contact => {
          if (contact.type === 'pv' && contact.contact_info?._id) {
            existingContactIds.add(contact.contact_info._id.toString());
          }
        });

        // Filter out current user and existing contacts
        const availableUsers = allUsers.filter(userItem => {
          const userId = (userItem._id || userItem.id)?.toString();
          return userId && 
                 userId !== user?.id?.toString() && 
                 !existingContactIds.has(userId);
        });

        setUsers(availableUsers);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter((userItem) => {
      const username = userItem.username?.toLowerCase() || '';
      const email = userItem.email?.toLowerCase() || '';
      return username.includes(query) || email.includes(query);
    });
  }, [searchQuery, users]);

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
            <Input
              type="text"
              placeholder="Search by username or email..."
              icon={faSearch}
              size="md"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <div className={styles.usersList}>
              {filteredUsers.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>
                    {searchQuery.trim()
                      ? 'No users found matching your search.'
                      : 'No users available.'}
                  </p>
                </div>
              ) : (
                filteredUsers.map((userItem) => (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default NewConversationModal;

