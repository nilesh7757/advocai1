import React, { useState, useRef, useEffect } from 'react';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

const CommentForm = ({ documentId, parentCommentId = null, onCommentAdded, placeholder = "Add a comment..." }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Mentions autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  const handleTextChange = async (e) => {
    const value = e.target.value;
    setContent(value);

    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, selectionStart);
    
    // Check if the cursor is at a word that starts with @
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);
    
    if (match) {
      const query = match[1];
      setMentionQuery(query);
      setShowSuggestions(true);
      setActiveIndex(0);
      
      try {
        const response = await axios.get(`/api/auth/users/?q=${query}`);
        setSuggestions(response.data || []);
      } catch (err) {
        console.error('Error fetching user autocomplete suggestions:', err);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const selectSuggestion = (username) => {
    if (!textareaRef.current) return;
    const selectionStart = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, selectionStart);
    const textAfterCursor = content.slice(selectionStart);
    
    const newTextBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_-]*)$/, `@${username} `);
    setContent(newTextBefore + textAfterCursor);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Refocus and place cursor after the mention
    setTimeout(() => {
      textareaRef.current.focus();
      const newCursorPos = newTextBefore.length;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex].username);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }
  };

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        document_id: documentId,
        content: content,
        parent_comment: parentCommentId,
      };
      await axios.post(`/api/documents/${documentId}/comments/`, payload);
      setContent('');
      setShowSuggestions(false);
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 relative">
      <textarea
        ref={textareaRef}
        className="w-full p-2 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground placeholder-muted-foreground"
        rows="3"
        placeholder={placeholder}
        value={content}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        disabled={loading}
      ></textarea>
      
      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef} 
          className="absolute z-50 bottom-full mb-1 left-0 bg-card border border-border rounded-lg shadow-xl overflow-y-auto max-h-40 w-52 py-1 select-none"
        >
          {suggestions.map((user, idx) => (
            <div
              key={user.username}
              onClick={() => selectSuggestion(user.username)}
              className={`px-3 py-1.5 text-xs text-foreground cursor-pointer flex flex-col hover:bg-muted font-medium transition-colors ${
                idx === activeIndex ? 'bg-muted' : ''
              }`}
            >
              <span className="font-bold">@{user.username}</span>
              <span className="text-[9px] text-muted-foreground">{user.name}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
      <button
        type="submit"
        className="mt-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-colors"
        disabled={loading}
      >
        {loading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
};

export default CommentForm;
