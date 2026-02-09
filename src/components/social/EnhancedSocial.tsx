import React, { useState } from 'react';
import { Users, MessageCircle, Heart, Share2, UserPlus, Trophy, TrendingUp } from 'lucide-react';
import { SocialPost, Comment } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

const EnhancedSocial: React.FC = () => {
  const { user } = useAppContext();
  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: '1',
      author: 'NeonSamurai',
      authorId: 'user1',
      content: 'Just completed the 5AM protocol for 30 days straight. My focus is laser sharp.',
      timestamp: '2h ago',
      likes: 42,
      isSystem: false,
      comments: [],
    },
    {
      id: '2',
      author: 'System',
      authorId: 'system',
      content: 'User @GhostWalker has ascended to Rank: Adept.',
      timestamp: '4h ago',
      likes: 128,
      isSystem: true,
      comments: [],
    },
  ]);
  const [following, setFollowing] = useState<string[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + (post.likes === 0 ? 1 : 0) }
        : post
    ));
  };

  const handleFollow = (userId: string) => {
    setFollowing(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handlePost = () => {
    if (!newPostContent.trim() || !user) return;

    const newPost: SocialPost = {
      id: Date.now().toString(),
      author: user.username,
      authorId: user.id,
      content: newPostContent,
      timestamp: 'Ahora',
      likes: 0,
      isSystem: false,
      comments: [],
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostContent('');
  };

  const handleComment = (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim() || !user) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      postId,
      author: user.username,
      authorId: user.id,
      content: commentText,
      timestamp: new Date().toISOString(),
    };

    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, comments: [...(post.comments || []), newComment] }
        : post
    ));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = posts; // Could filter by following

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="text-ritual-accent" size={24} />
          <h2 className="text-2xl font-display font-bold">El Coven</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <TrendingUp size={16} />
          <span>Ranking disponible pronto</span>
        </div>
      </div>

      {/* Create Post */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 flex-shrink-0">
            {user?.username.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Comparte tus logros con la comunidad..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-600 focus:border-ritual-accent outline-none resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handlePost}
                disabled={!newPostContent.trim()}
                className="px-4 py-2 bg-ritual-accent text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  post.isSystem ? 'bg-ritual-accent/20' : 'bg-zinc-800'
                }`}>
                  {post.isSystem ? (
                    <Trophy className="text-ritual-accent" size={20} />
                  ) : (
                    <span className="text-zinc-400 font-bold">
                      {post.author.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${
                      post.isSystem ? 'text-ritual-accent' : 'text-white'
                    }`}>
                      @{post.author}
                    </span>
                    {!post.isSystem && post.authorId !== user?.id && (
                      <button
                        onClick={() => handleFollow(post.authorId!)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          following.includes(post.authorId!)
                            ? 'bg-ritual-accent/10 border-ritual-accent text-ritual-accent'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {following.includes(post.authorId!) ? (
                          <>
                            <UserPlus size={12} className="inline mr-1" />
                            Siguiendo
                          </>
                        ) : (
                          <>
                            <UserPlus size={12} className="inline mr-1" />
                            Seguir
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-zinc-600 text-xs">{post.timestamp}</span>
                </div>
              </div>
            </div>

            <p className="text-zinc-300 mb-4">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-6 text-zinc-500">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-2 hover:text-ritual-accent transition-colors"
              >
                <Heart size={18} className={post.likes > 0 ? 'fill-red-500 text-red-500' : ''} />
                <span className="text-sm">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-ritual-accent transition-colors">
                <MessageCircle size={18} />
                <span className="text-sm">{post.comments?.length || 0}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-ritual-accent transition-colors">
                <Share2 size={18} />
              </button>
            </div>

            {/* Comments */}
            {post.comments && post.comments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-zinc-400 font-bold">
                        {comment.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">@{comment.author}</span>
                        <span className="text-xs text-zinc-600">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="Escribe un comentario..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-600 focus:border-ritual-accent outline-none text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleComment(post.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleComment(post.id)}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                >
                  Comentar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedSocial;
