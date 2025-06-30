import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { extractUrls, fetchLinkPreview } from '../../utils/linkPreview';
import ApiService from '../../services/api';
import styles from '../../styles/terminal/SocialFeed.module.css';

const SocialFeed = () => {
  const { token, currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Rotating placeholder texts
  const placeholderTexts = [
    'Кажете што има ново со Вашата фирма?',
    'Објавете инфо за Вашата нова услуга или производ',
    'Споделете совети за Вашата индустрија',
    'Кажете за Вашите најнови достигнувања',
    'Објавете за настани во Вашата компанија',
    'Споделете интересни новости од Вашиот сектор'
  ];

  // Rotate placeholder text every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholderTexts.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [placeholderTexts.length]);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await ApiService.request(`/social/newsfeed?filter=${filter}`);
      setPosts(data?.posts || []); // Ensure posts is an array
    } catch (error) {
      setError('Настана грешка при вчитување на објавите. Обидете се повторно.');
      setPosts([]); // Ensure posts is an array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filter, token]); // eslint-disable-line react-hooks/exhaustive-deps 
  // Added token to dependency array as it's used in ApiService, and fetchPosts is called on mount.

  // Create new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      setPosting(true);
      const response = await ApiService.request('/social/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: newPostContent,
        }),
      });

      // The API returns { message, post }, so we need to extract the post
      const newPost = response.post;
      
      // Add the new post to the beginning of the posts array for immediate display
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setNewPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
      
      // Handle specific error types
      if (error.isAuthError || error.status === 401) {
        setError('Сесијата е истечена. Најавете се повторно.');
      } else {
        setError('Настана грешка при креирање на објавата. Обидете се повторно.');
      }
    } finally {
      setPosting(false);
    }
  };

  // Add comment
  const handleComment = async (postId, commentContent) => {
    if (!commentContent.trim()) return;

    try {
      const response = await ApiService.request(`/social/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: commentContent,
        }),
      });

      // Backend returns { message, comment, commentsCount }
      const newComment = response.comment;

      setPosts(prevPosts => prevPosts.map(post =>
        post._id === postId
          ? { ...post, comments: [...(post.comments || []), newComment] } // Add the actual comment object
          : post
      ));
    } catch (error) {
      // setError('Настана грешка при додавање на коментарот.'); // Optional: user-facing error
    }
  };

  // Delete post functions
  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      setDeleting(true);
      await ApiService.request(`/social/posts/${postToDelete._id}`, {
        method: 'DELETE',
      });

      // Remove the deleted post from the posts array
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postToDelete._id));
      
      // Close modal and reset state
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      
      // Handle specific error types
      if (error.isAuthError || error.status === 401) {
        setError('Сесијата е истечена. Најавете се повторно.');
      } else if (error.status === 403) {
        setError('Немате дозвола да ја избришете оваа објава.');
      } else {
        setError('Настана грешка при бришење на објавата. Обидете се повторно.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setPostToDelete(null);
  };

  // Check if current user can delete the post
  const canDeletePost = (post) => {
    if (!currentUser || !post.author) return false;
    
    // User can delete their own posts or if they are admin
    return post.author._id === currentUser._id || 
           post.author === currentUser._id || 
           currentUser.isAdmin;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `пред ${diffInSeconds}с`;
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `пред ${diffInMinutes}м`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `пред ${diffInHours}ч`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `пред ${diffInDays}д`;
  };

  const getPostTypeIcon = (postType) => {
    switch (postType) {
      case 'admin_news': return '📰';
      case 'admin_investment': return '💰';
      default: return '👤'; // Changed from '🏢' to represent user/company post more generally
    }
  };

  if (loading && posts.length === 0) { // Show loading only if there are no posts yet
    return <div className={styles.loading}>Се вчитуваат објави...</div>;
  }

  return (
    <div className={styles.socialFeed}>
      {/* Create new post */}
      <div className={styles.createPost}>
        <form onSubmit={handleCreatePost}>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={placeholderTexts[placeholderIndex]}
            className={styles.postTextarea}
            rows={3}
          />
          <div className={styles.postActions}>
            <button
              type="submit"
              disabled={posting || !newPostContent.trim()}
              className={styles.postButton}
            >
              {posting ? 'Објавување...' : 'Објави'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter buttons */}
      <div className={styles.filterSection}>
        <button
          className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          Сите објави
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'posts' ? styles.active : ''}`}
          onClick={() => setFilter('posts')}
        >
          Кориснички објави
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'news' ? styles.active : ''}`}
          onClick={() => setFilter('news')}
        >
          Вести
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'investments' ? styles.active : ''}`}
          onClick={() => setFilter('investments')}
        >
          Инвестиции
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Posts list */}
      {!loading && posts.length === 0 && !error && (
         <div className={styles.noPosts}>Нема објави за прикажување.</div>
      )}
      <div className={styles.postsList}>
        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            // onLike={handleLike} // Removing like functionality
            onComment={handleComment}
            formatDate={formatDate}
            getPostTypeIcon={getPostTypeIcon}
            currentUser={currentUser}
            onDelete={openDeleteModal} // Pass delete function
            canDeletePost={canDeletePost} // Pass delete permission function
          />
        ))}
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className={styles.deleteModal}>
          <div className={styles.modalContent}>
            <h3>Потврди бришење</h3>
            <p>Дали сте сигурни дека сакате да ја избришете оваа објава?</p>
            <div className={styles.modalActions}>
              <button onClick={closeDeleteModal} className={styles.cancelButton}>
                Откажи
              </button>
              <button onClick={handleDeletePost} className={styles.confirmButton} disabled={deleting}>
                {deleting ? 'Бришење...' : 'Да, избриши'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Post Component
const PostCard = ({ post, /* onLike, */ onComment, formatDate, getPostTypeIcon, currentUser, onDelete, canDeletePost }) => { // Removed onLike
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [linkPreview, setLinkPreview] = useState(null);
  const { user } = useAuth(); // Get current user for comment author

  // Extract URLs from post content for link preview
  useEffect(() => {
    if (post && post.content) {
      const urls = extractUrls(post.content);
      if (urls.length > 0) {
        fetchLinkPreview(urls[0]).then(preview => {
          if (preview) {
            setLinkPreview(preview);
          }
        }).catch(err => {
          // Silently handle link preview errors
        });
      } else {
        setLinkPreview(null); // Reset preview if no URLs
      }
    } else {
      setLinkPreview(null); // Reset preview if no content
    }
  }, [post.content]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    onComment(post._id, commentContent);
    setCommentContent('');
  };

  const getPostTypeLabel = (postType) => {
    switch (postType) {
      case 'admin_news': return 'Вест';
      case 'admin_investment': return 'Инвестиција';
      default: return 'Објава'; // General user post
    }
  };
  
  const postUser = post.user || post.author || post.companyInfo; // Adapt based on actual data structure
  const userName = postUser?.name || postUser?.username || 'Анонимен корисник';
  const userAvatar = postUser?.profilePicture || postUser?.avatar || ''; // Default avatar if none

  return (
    <div className={styles.postCard}>
      {/* Company Information Section - 1/3 of the post */}
      <div className={styles.companySection}> {/* Ensure this class is styled for 1/3 width */}
        <div className={styles.companyDetails}>
          {/* Company Logo - Always show a logo (either the provided one or a placeholder) */}
          <div className={styles.companyLogoContainer}>
            {post.author?.companyInfo?.logoUrl ? (
              <img 
                src={post.author.companyInfo.logoUrl} 
                alt={`${post.author?.companyInfo?.companyName || 'Company'} logo`}
                className={styles.companyLogo}
                onError={(e) => {
                  // If logo fails to load, show the first letter of company name as fallback
                  e.target.style.display = 'none';
                  const placeholderElement = document.createElement('div');
                  placeholderElement.className = styles.companyLogoPlaceholder;
                  placeholderElement.innerText = (post.author?.companyInfo?.companyName || 'C').charAt(0).toUpperCase();
                  e.target.parentNode.appendChild(placeholderElement);
                }}
              />
            ) : (
              <div className={styles.companyLogoPlaceholder}>
                {(post.author?.companyInfo?.companyName || 'C').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className={styles.companyName}>
            {/* Use company name from user's companyInfo */}
            {post.author?.companyInfo?.companyName || 'Анонимен корисник'}
          </div>
          
          {/* Display company address */}
          {post.author?.companyInfo?.address && (
            <div className={styles.companyAddress}>
              📍 {post.author.companyInfo.address}
            </div>
          )}
          
          {/* Display company website */}
          {post.author?.companyInfo?.website && (
            <a href={post.author.companyInfo.website} target="_blank" rel="noopener noreferrer" className={styles.companyWebsite}>
              🌐 {post.author.companyInfo.website}
            </a>
          )}
          
          {/* Display company contact email */}
          {post.author?.companyInfo?.contactEmail && (
            <a href={`mailto:${post.author.companyInfo.contactEmail}`} className={styles.companyEmail}>
              ✉️ {post.author.companyInfo.contactEmail}
            </a>
          )}
          
          {/* Display company industry/business activity if available */}
          {post.author?.companyInfo?.industry && (
            <div className={styles.companyIndustry}>
              📊 {post.author.companyInfo.industry}
            </div>
          )}
          
          {/* Display company mission if available */}
          {post.author?.companyInfo?.mission && (
            <div className={styles.companyMission}>
              💼 {post.author.companyInfo.mission}
            </div>
          )}
        </div>
      </div>

      {/* Main Post Content Section - 2/3 of the post */}
      <div className={styles.postMainContent}> {/* Ensure this class is styled for 2/3 width */}
        <div className={styles.postHeader}>
          <div className={styles.authorInfo}>
            {/* {userAvatar ? (
              <img src={userAvatar} alt={userName} className={styles.authorAvatar} />
            ) : (
              <div className={styles.authorAvatarPlaceholder}>{userName.substring(0, 1)}</div>
            )} */}
            <div>
            </div>
          </div>
          <div className={styles.postHeaderRight}>

            
          </div>
        </div>

        <div className={styles.postContent}>
          <p>{post.content}</p>
          {linkPreview && (
            <a href={linkPreview.url} target="_blank" rel="noopener noreferrer" className={styles.linkPreview}>
              {linkPreview.image && <img src={linkPreview.image} alt={linkPreview.title || 'Link preview'} />}
              <div className={styles.linkPreviewInfo}>
                <h4>{linkPreview.title}</h4>
                <p>{linkPreview.description}</p>
                <span>{linkPreview.siteName || new URL(linkPreview.url).hostname}</span>
              </div>
            </a>
          )}
        </div>

        <div className={styles.postActions}>
          {/* <button onClick={() => onLike(post._id)} className={`${styles.actionButton} ${isLikedByCurrentUser ? styles.liked : ''}`}>
            <span role="img" aria-label="like">👍</span> 
            <span>{isLikedByCurrentUser ? 'Ви се допаѓа' : 'Ми се допаѓа'} ({post.likes?.length || 0})</span>
          </button> */} {/* Like button removed */}
                      <div className={styles.postTypeInfo}>
              <span className={styles.postTypeIcon}>{getPostTypeIcon(post.postType)}</span>
              <span className={styles.postTypeLabel}>{getPostTypeLabel(post.postType)}</span>
              <div className={styles.postTime}>{formatDate(post.createdAt)}</div>
    
            </div>
          <button onClick={() => setShowComments(!showComments)} className={styles.actionButton}>
            <span role="img" aria-label="comment">💬</span> 
            <span>Коментари ({post.comments?.length || 0})</span>
          </button>
          {canDeletePost(post) && ( // Show delete button only for post owner or admin
            <button onClick={() => onDelete(post)} className={styles.actionButton}>
              <span role="img" aria-label="delete">🗑️</span> 
              <span>Избриши</span>
            </button>
          )}
        </div>

        {showComments && (
          <div className={styles.commentsSection}>
            <h4>Коментари</h4>
            <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Напишете коментар..."
                rows={2}
                className={styles.commentTextarea}
              />
              <button type="submit" className={styles.commentSubmitButton} disabled={!commentContent.trim()}>
                Коментирај
              </button>
            </form>
            <div className={styles.commentsList}>
              {(post.comments && post.comments.length > 0) ? (
                post.comments.map(comment => (
                  <div key={comment._id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                       {comment.author?.profileImage ? (
                          <img src={comment.author.profileImage} alt={comment.author.email || 'User'} className={styles.commentAuthorAvatar} />
                        ) : (
                          <div className={styles.commentAuthorAvatarPlaceholder}>{(comment.author?.email || 'U').substring(0,1).toUpperCase()}</div>
                        )}
                      <span className={styles.commentAuthor}>{comment.author?.email || 'Анонимен'}</span>
                      <span className={styles.commentTime}>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className={styles.commentContent}>{comment.content}</p>
                  </div>
                ))
              ) : (
                <p>Нема коментари сè уште.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialFeed;

// Removed the old PostCard structure that was split into companySidebar and postMainContent
// as the new structure is more typical for a social feed post.
// The data structure for posts (post.user, post.author, post.companyInfo) needs to be consistent
// from the backend or handled more robustly here.
// For example, a post might have a `user` object with `name` and `profilePicture`.
// Admin posts (news, investment) might have a different structure or a generic "Admin" user.
// This example assumes `post.user.name` and `post.user.profilePicture` for user posts,
// and `post.author.name` for other types if `post.user` is not present.
// The `currentUser` prop was removed from PostCard as `useAuth` can be used directly if needed,
// or better, pass specific user data like `currentUserId` if PostCard shouldn't be coupled with AuthContext.
// For simplicity, `useAuth` is now used in PostCard to get the current user for like status.
