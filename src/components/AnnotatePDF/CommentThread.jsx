import React, { useState } from 'react';
import { MoreHorizontal, MessageSquare, CornerDownRight, Check, Trash2 } from 'lucide-react';

export default function CommentThread({ comments = [], onAddComment, onResolve, onDelete }) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment({ text: newComment, parentId: null });
    setNewComment('');
  };

  const handleReplySubmit = (parentId) => {
    if (!replyText.trim()) return;
    onAddComment({ text: replyText, parentId });
    setReplyText('');
    setReplyingTo(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          Comments
        </h3>
        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{comments.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gray-50/50">
        {comments.filter(c => !c.parentId).map(comment => (
          <div key={comment.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 relative group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {comment.author.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{comment.author}</p>
                  <p className="text-[10px] text-gray-500">{new Date(comment.date).toLocaleDateString()} {new Date(comment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                 <button onClick={() => onResolve(comment.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Resolve">
                   <Check className="w-3 h-3" />
                 </button>
                 <button onClick={() => onDelete(comment.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">
                   <Trash2 className="w-3 h-3" />
                 </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
            
            <div className="flex gap-3 text-xs text-gray-500 mb-3">
              <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="hover:text-indigo-600 font-medium">Reply</button>
              {comment.resolved && <span className="text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3"/> Resolved</span>}
            </div>

            {/* Replies */}
            {comments.filter(c => c.parentId === comment.id).map(reply => (
              <div key={reply.id} className="ml-4 pl-3 border-l-2 border-gray-100 mt-2 relative group">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-semibold text-gray-800">{reply.author}</span>
                     <span className="text-[10px] text-gray-400">{new Date(reply.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button onClick={() => onDelete(reply.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-600">{reply.text}</p>
              </div>
            ))}

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReplySubmit(comment.id);
                  }}
                />
                <button onClick={() => handleReplySubmit(comment.id)} className="text-xs bg-indigo-50 text-indigo-600 px-2 rounded font-medium hover:bg-indigo-100">Send</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-100 bg-white">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a new comment..."
            className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow bg-gray-50 hover:bg-white focus:bg-white"
          />
          <button type="submit" disabled={!newComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50 transition-colors">
            <CornerDownRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
