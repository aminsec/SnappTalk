import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation,
  faXmark,
  faVideo,
  faImage,
  faFile as faFileSolid,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { ProfileAvatar } from '@/shared/components';
import sentIcon from "@/shared/assets/icons/sent.svg";
import seenIcon from "@/shared/assets/icons/seen.svg";
import {
  convertISOtoLocal,
  formatFileSize,
  truncateMessage,
  getMessagePreviewText,
  isEmojiOnlyMessage,
  getMessageMediaUrl,
  getMessageDownloadUrl,
  getSenderId,
  getRenderableMediaType,
  getMessageFileName,
  getFileExtension,
  VISUAL_MEDIA_TYPES,
  getLockedMediaBox,
} from '../../utils/chatHelpers';
import { MediaDimensions } from '../../types/chatPage.types';
import { AudioPlayer, VideoPlayer } from '../MediaContent';
import { DownloadProgressRing } from './DownloadProgressRing';
import styles from '../../pages/Chats/Chat.module.css';

export interface MessageBubbleProps {
  message: any;
  index: number;
  user: any;
  selectedChat: any;
  showDateSeparator: boolean;
  dateSeparatorText?: string;
  isEntering?: boolean;
  replyPreview?: any;
  senderInfo?: any;
  resolvedMediaUrl?: string;
  mediaPreviewUrl?: string;
  isManualMediaLoading?: boolean;
  downloadProgress?: number;
  uploadProgress?: number;
  mediaDimensions?: MediaDimensions | null;
  onSetRef?: (el: HTMLDivElement | null) => void;
  onContextMenu: (e: React.MouseEvent, message: any, isMyMessage: boolean) => void;
  onDoubleClick: (message: any) => void;
  onMemberClick: (memberId: string) => void;
  onScrollToMessage: (targetMessageId: string) => void;
  onResendMessage: (message: any) => void;
  onCancelMediaUpload: (messageId: string) => void;
  onLoadMediaMessage: (message: any) => void;
  onDownloadMessage: (message: any) => void;
  onOpenMediaViewer: (media: { url: string; message: any; type: string }) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  index,
  user,
  selectedChat,
  showDateSeparator,
  dateSeparatorText,
  isEntering = false,
  replyPreview,
  senderInfo,
  resolvedMediaUrl = '',
  mediaPreviewUrl = '',
  isManualMediaLoading = false,
  downloadProgress,
  uploadProgress,
  mediaDimensions = null,
  onSetRef,
  onContextMenu,
  onDoubleClick,
  onMemberClick,
  onScrollToMessage,
  onResendMessage,
  onCancelMediaUpload,
  onLoadMediaMessage,
  onDownloadMessage,
  onOpenMediaViewer,
}) => {
  const userId = user?._id || user?.id;
  const messageSenderId = getSenderId(message)?.toString();
  const currentUserId = userId?.toString() || userId;
  const isMyMessage = Boolean(messageSenderId && currentUserId) &&
    messageSenderId === currentUserId;
  const messageId = message._id || message.id || `msg-${index}`;
  const messageContent = message.content || message.text || '';
  const messageTime = message.when || message.timestamp || message.created_at;
  const isPrivateChat = selectedChat?.type === 'pv';
  const isGroupChat = selectedChat?.type === 'group';

  const mediaUrl = resolvedMediaUrl
    || (message?.attachment_key
      ? getMessageDownloadUrl(message)
      : getMessageMediaUrl(message));
  const messageType = message.type || (mediaUrl ? 'file' : 'text');
  const resolvedMessageType = getRenderableMediaType({
    ...message,
    type: messageType,
  });
  const isMediaReady = Boolean(mediaUrl);
  const isMedia = Boolean(mediaUrl || message?.attachment_key);
  const isAudioMedia = ['voice', 'audio'].includes(resolvedMessageType);
  const isVisualMedia = VISUAL_MEDIA_TYPES.includes(resolvedMessageType);
  const hasDownloadProgress = typeof downloadProgress === 'number';

  const lockedMediaBox = getLockedMediaBox(
    mediaDimensions,
    resolvedMessageType
  );
  const lockApplies = Boolean(lockedMediaBox)
    && ['image', 'gif', 'video'].includes(resolvedMessageType);
  const lockedBoxWidth = lockedMediaBox ? `${lockedMediaBox.width}px` : undefined;
  const lockedBoxRatio = lockedMediaBox?.aspectRatio;
  const showMediaDownloadPreview = Boolean(
    message?.attachment_key
    && !mediaUrl
    && isVisualMedia
  );
  const showAudioDownloadButton = Boolean(
    message?.attachment_key
    && !mediaUrl
    && isAudioMedia
  );
  const hasMediaCaption = isMedia && Boolean(messageContent.trim());

  const lockedPreviewStyle = !lockApplies
    ? undefined
    : resolvedMessageType === 'video'
      ? (hasMediaCaption
        ? { aspectRatio: lockedBoxRatio }
        : { width: lockedBoxWidth, maxWidth: 'min(100%, 76vw)', aspectRatio: lockedBoxRatio })
      : resolvedMessageType === 'gif' || !hasMediaCaption
        ? { width: lockedBoxWidth, maxWidth: '100%', aspectRatio: lockedBoxRatio }
        : { aspectRatio: lockedBoxRatio };
  const hasReplyMedia = isMedia && Boolean(replyPreview);
  const showMediaFooter = isMedia && !hasMediaCaption;
  const isDocument = resolvedMessageType === 'document'
    || resolvedMessageType === 'file'
    || (messageType === 'document');
  const isVisualManualPreview = showMediaDownloadPreview
    && !isDocument
    && isVisualMedia;
  const isMediaOnly = isMedia && !messageContent.trim() && !replyPreview;
  const isEmojiOnly = isEmojiOnlyMessage(messageContent);
  const shouldUseEmojiOnlyStyle = isEmojiOnly && !replyPreview && !isMedia;
  const replyPreviewText = truncateMessage(
    getMessagePreviewText(replyPreview),
    80
  );
  const senderIdStr = messageSenderId;
  const shouldShowSenderMeta = !isMyMessage && isGroupChat;
  const senderName = shouldShowSenderMeta
    ? (senderInfo?.username
        || message.sender_username
        || message.sender_name
        || message.sender_info?.username
        || 'Member')
    : null;
  const senderAvatar = shouldShowSenderMeta
    ? (senderInfo?.profile_pic || message.sender_info?.profile_pic || null)
    : null;
  const isGifMessage = resolvedMessageType === 'gif';
  const deliveryStatus = isMyMessage && (isPrivateChat || isGifMessage)
    ? (message?.status || 'sent')
    : null;

  const isUploadingMedia = isMyMessage
    && typeof uploadProgress === 'number'
    && uploadProgress < 100;

  // Reusable footer (time + seen)
  const messageFooterMarkup = (
    <>
      {message?.edited && (
        <span className={styles.editedBadge}>edited</span>
      )}
      <span className={styles.timestamp}>
        {convertISOtoLocal(messageTime)}
      </span>
      {isMyMessage && (isPrivateChat || isGifMessage) && (
        <span className={styles.seenIcon}>
          {deliveryStatus === 'pending' && (
            <span className={styles.deliveryClock} title="Sending">
              <span className={styles.deliveryClockFace} />
              <span className={styles.deliveryClockHandShort} />
              <span className={styles.deliveryClockHandLong} />
            </span>
          )}
          {deliveryStatus === 'error' && (
            <button
              type="button"
              className={styles.deliveryErrorButton}
              onClick={() => onResendMessage(message)}
              title="Message failed. Click to resend."
            >
              <FontAwesomeIcon icon={faCircleExclamation} />
            </button>
          )}
          {deliveryStatus === 'sent' && (
            <img
              src={message?.seen ? seenIcon : sentIcon}
              alt={message?.seen ? "Seen" : "Sent"}
              className={styles.seenIconImage}
            />
          )}
        </span>
      )}
    </>
  );

  return (
    <>
      {/* Render Date Separator if day changed */}
      {showDateSeparator && dateSeparatorText && (
        <div className={styles.dateSeparator}>
          <span className={styles.dateSeparatorText}>
            {dateSeparatorText}
          </span>
        </div>
      )}

      <div
        className={`${
          styles.messageWrapper
        } ${
          isMyMessage ? styles.messageWrapperSent : styles.messageWrapperReceived
        } ${
          !isMyMessage && isGroupChat ? styles.messageWrapperGroup : ''
        } ${
          isEntering ? styles.messageEnter : ''
        }`}
        ref={onSetRef}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, message, isMyMessage);
        }}
        onDoubleClick={() => onDoubleClick(message)}
      >
        {shouldShowSenderMeta && (
          <div className={styles.messageAvatar}>
            <button
              type="button"
              className={styles.profileAvatarButton}
              onClick={() => {
                if (senderIdStr) {
                  onMemberClick(senderIdStr);
                }
              }}
            >
              <ProfileAvatar
                src={senderAvatar}
                size={36}
                alt={senderName || 'Member'}
                borderWidth={0}
              />
            </button>
          </div>
        )}
        <div
          className={`${styles.message} ${isMyMessage ? styles.sent : styles.received} ${
            shouldUseEmojiOnlyStyle ? styles.emojiOnly : ''
          } ${isMediaOnly ? styles.mediaOnly : ''} ${hasMediaCaption ? styles.mediaWithCaption : ''} ${hasReplyMedia ? styles.mediaWithReply : ''} ${isVisualManualPreview ? styles.mediaWithManualPreview : ''}`}
          data-message-type={isMyMessage ? 'sent' : 'received'}
        >
          {replyPreview && (
            <div
              className={styles.replyPreview}
              role="button"
              tabIndex={0}
              onClick={() => onScrollToMessage(replyPreview?.messageId || replyPreview?.message_id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onScrollToMessage(replyPreview?.messageId || replyPreview?.message_id);
                }
              }}
            >
              <div className={styles.replyPreviewLine} />
              <div className={styles.replyPreviewContent}>
                <div className={styles.replyPreviewHeader}>
                  <span className={styles.replyPreviewLabel}>
                    {(() => {
                      const replySenderId = getSenderId(replyPreview)?.toString();
                      const curUserId = (user?._id || user?.id)?.toString();
                      if (replySenderId && curUserId && replySenderId === curUserId) return 'You';
                      if (selectedChat?.type === 'pv') {
                        return selectedChat?.contact_info?.username || 'User';
                      }
                      return replyPreview?.sender_info?.username
                        || replyPreview?.sender_name
                        || replyPreview?.sender_username
                        || replyPreview?.sender
                        || 'Member';
                    })()}
                  </span>
                </div>
                <p className={styles.replyPreviewText}>
                  {replyPreviewText}
                </p>
              </div>
            </div>
          )}
          {shouldShowSenderMeta && (
            <div className={styles.messageSenderName}>
              <button
                type="button"
                className={styles.profileLinkInline}
                onClick={() => {
                  const senderId = messageSenderId;
                  if (senderId) {
                    onMemberClick(senderId);
                  }
                }}
              >
                {senderName}
              </button>
            </div>
          )}
          {isUploadingMedia && !isGifMessage && (
            <div className={styles.mediaUploadOverlay}>
              <button
                type="button"
                className={styles.mediaUploadCircle}
                onClick={(event) => {
                  event.stopPropagation();
                  onCancelMediaUpload(messageId);
                }}
                aria-label={`Cancel upload of ${getMessageFileName(message) || 'media'}`}
                title="Cancel upload"
                style={{
                  background: `conic-gradient(var(--btn-color) ${(uploadProgress || 0) * 3.6}deg, rgba(255,255,255,0.25) 0deg)`,
                }}
              >
                <div className={styles.mediaUploadCircleInner}>
                  <FontAwesomeIcon icon={faXmark} className={styles.mediaUploadCancelIcon} />
                  <span className={styles.mediaUploadPercent}>
                    {Math.round(uploadProgress || 0)}%
                  </span>
                </div>
              </button>
            </div>
          )}
          {showMediaDownloadPreview && !isDocument && (
            <button
              type="button"
              className={`${styles.mediaManualPreview} ${
                resolvedMessageType === 'video'
                  ? styles.mediaManualPreviewVideo
                  : styles.mediaManualPreviewVisual
              } ${
                isManualMediaLoading ? styles.mediaManualPreviewLoading : ''
              }`}
              style={lockedPreviewStyle}
              onClick={() => onLoadMediaMessage(message)}
              aria-label={isManualMediaLoading
                ? `Cancel ${resolvedMessageType} download`
                : hasDownloadProgress
                  ? `Resume ${resolvedMessageType} download`
                  : `Download ${resolvedMessageType} media`}
            >
              {mediaPreviewUrl && resolvedMessageType === 'video' && (
                <video
                  className={styles.mediaManualPreviewMedia}
                  src={mediaPreviewUrl}
                  muted
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                />
              )}
              {mediaPreviewUrl && resolvedMessageType !== 'video' && (
                <img
                  className={styles.mediaManualPreviewMedia}
                  src={mediaPreviewUrl}
                  alt=""
                  aria-hidden="true"
                />
              )}
              <span className={styles.mediaManualBlur} aria-hidden="true" />
              <span className={styles.mediaManualAction}>
                <span className={styles.mediaManualIcon}>
                  {hasDownloadProgress || isManualMediaLoading ? (
                    <DownloadProgressRing
                      progress={downloadProgress || 0}
                      active={isManualMediaLoading}
                    />
                  ) : isManualMediaLoading ? (
                    <span className={styles.mediaManualSpinner} />
                  ) : (
                    <FontAwesomeIcon icon={resolvedMessageType === 'video' ? faVideo : faImage} />
                  )}
                </span>
                {!isManualMediaLoading && !hasDownloadProgress && (
                  <>
                    <strong>
                      Download {resolvedMessageType === 'video' ? 'video' : 'media'}
                    </strong>
                    <small>Tap to load</small>
                  </>
                )}
              </span>
              {isMediaOnly && (
                <span className={styles.mediaManualFooter}>
                  {messageFooterMarkup}
                </span>
              )}
            </button>
          )}
          {isMediaReady && (resolvedMessageType === 'video') && (
            <VideoPlayer
              src={mediaUrl}
              mimeType={message?.mime_type || 'video/mp4'}
              footer={showMediaFooter ? messageFooterMarkup : undefined}
              style={lockApplies && resolvedMessageType === 'video'
                ? (hasMediaCaption
                  ? { aspectRatio: lockedBoxRatio }
                  : { width: lockedBoxWidth, aspectRatio: lockedBoxRatio })
                : undefined}
              className={styles.videoPlayer}
            />
          )}
          {isMedia && isAudioMedia && (
            <AudioPlayer
              src={mediaUrl}
              fileName={getMessageFileName(message)}
              isVoice={resolvedMessageType === 'voice'}
              accent={isMyMessage ? 'rgba(255,255,255,0.82)' : 'var(--chat-accent)'}
              footer={showMediaFooter ? messageFooterMarkup : undefined}
              onDownload={showAudioDownloadButton
                ? () => onLoadMediaMessage(message)
                : undefined}
              isDownloading={isManualMediaLoading}
              downloadProgress={downloadProgress}
            />
          )}
          {isDocument && (
            <div className={styles.mediaDocumentWrap}>
              <button
                type="button"
                className={styles.fileAttachment}
                onClick={() => onDownloadMessage(message)}
                aria-label={isManualMediaLoading
                  ? `Cancel download of ${getMessageFileName(message) || 'attachment'}`
                  : hasDownloadProgress
                    ? `Resume download of ${getMessageFileName(message) || 'attachment'}`
                    : `Download ${getMessageFileName(message) || 'attachment'}`}
              >
                <span className={styles.fileAttachmentIcon}>
                  <span>{getFileExtension(getMessageFileName(message))}</span>
                  <FontAwesomeIcon icon={faFileSolid} />
                </span>
                <span className={styles.fileAttachmentInfo}>
                  <span className={styles.fileAttachmentName}>
                    {getMessageFileName(message) || 'Attachment'}
                  </span>
                  <span className={styles.fileAttachmentSize}>
                    {message?.file_size ? formatFileSize(message.file_size) : 'Document'}
                  </span>
                </span>
                <span className={styles.fileAttachmentDownload}>
                  {hasDownloadProgress || isManualMediaLoading ? (
                    <DownloadProgressRing
                      progress={downloadProgress || 0}
                      active={isManualMediaLoading}
                      compact
                    />
                  ) : (
                    <FontAwesomeIcon icon={faDownload} />
                  )}
                </span>
              </button>
              {showMediaFooter && (
                <div className={styles.mediaDocumentFooter}>
                  {messageFooterMarkup}
                </div>
              )}
            </div>
          )}
          {isMediaReady && !isDocument && !['video', 'voice', 'audio'].includes(resolvedMessageType) && (
            <div
              className={styles.mediaImageWrap}
              style={lockApplies && resolvedMessageType === 'image'
                ? (hasMediaCaption
                  ? { aspectRatio: lockedBoxRatio }
                  : { width: lockedBoxWidth, aspectRatio: lockedBoxRatio })
                : undefined}
            >
              <button
                type="button"
                className={styles.mediaImageButton}
                onClick={() => {
                  onOpenMediaViewer({
                    url: mediaUrl,
                    message,
                    type: resolvedMessageType,
                  });
                }}
                aria-label="Open media viewer"
              >
                <img
                  src={mediaUrl}
                  alt={getMessageFileName(message) || resolvedMessageType}
                  className={`${styles.messageMedia} ${
                  resolvedMessageType === 'sticker'
                    ? styles.messageMediaSticker
                    : resolvedMessageType === 'gif'
                      ? styles.messageMediaGif
                      : styles.messageMediaImage
                }`}
                style={lockApplies && resolvedMessageType === 'gif'
                  ? { width: lockedBoxWidth, aspectRatio: lockedBoxRatio, maxHeight: 'none' }
                  : undefined}
                onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </button>
              {!['sticker', 'gif'].includes(resolvedMessageType) && (
                <button
                  type="button"
                  className={styles.mediaQuickDownload}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDownloadMessage(message);
                  }}
                  aria-label="Download media"
                >
                  <FontAwesomeIcon icon={faDownload} />
                </button>
              )}
              {showMediaFooter && (
                <div className={styles.mediaImageFooter}>
                  {messageFooterMarkup}
                </div>
              )}
            </div>
          )}
          {hasMediaCaption ? (
            <div className={styles.mediaCaptionBlock}>
              <p dir="auto" className={styles.mediaCaptionText}>{messageContent}</p>
              <div className={`${styles.messageFooter} ${styles.mediaCaptionFooter}`}>
                {messageFooterMarkup}
              </div>
            </div>
          ) : (
            messageContent.trim() && (
              <p dir="auto" className={styles.messageText}>{messageContent}</p>
            )
          )}
          {!isMedia && !hasMediaCaption && (
            <div className={styles.messageFooter}>
              {messageFooterMarkup}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default MessageBubble;
