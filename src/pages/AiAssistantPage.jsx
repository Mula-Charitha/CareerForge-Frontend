import React, { useState, useEffect, useRef } from 'react';
import {
  sendAiChat,
  getAiChatHistory,
  clearAiChatHistory,
  getAiSuggestedPrompts,
} from '../services/api';
import './AiAssistantPage.css';

const AiAssistantPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInitialData = async () => {
    try {
      setFetchingHistory(true);
      const [historyData, promptsData] = await Promise.all([
        getAiChatHistory(),
        getAiSuggestedPrompts(),
      ]);
      setMessages(historyData || []);
      setSuggestedPrompts(promptsData || []);
    } catch (err) {
      console.error('Error loading AI Assistant data:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleSendMessage = async (promptToSend = inputPrompt, promptCategory = category) => {
    const trimmed = promptToSend.trim();
    if (!trimmed || loading) return;

    // Optimistically add user message to UI
    const tempUserMsg = {
      id: Date.now(),
      userPrompt: trimmed,
      aiResponse: null,
      category: promptCategory,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await sendAiChat(trimmed, promptCategory);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempUserMsg.id ? response : m))
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempUserMsg.id
            ? {
                ...m,
                aiResponse:
                  '⚠️ Sorry, I encountered an issue processing your query. Please check your connection and try again.',
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history?')) return;
    try {
      await clearAiChatHistory();
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="ai-md-h3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="ai-md-h2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ai-md-li">
            {formatBold(line.replace('- ', ''))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <p key={idx} className="ai-md-numbered">
            {formatBold(line)}
          </p>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="ai-md-spacer" />;
      }
      return (
        <p key={idx} className="ai-md-p">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="ai-assistant-container">
      {/* Top Header */}
      <div className="ai-header">
        <div className="ai-header-info">
          <div className="ai-logo-badge">🤖</div>
          <div>
            <h1 className="page-title">AI Placement & Career Co-Pilot</h1>
            <p className="page-subtitle">
              Your 24/7 placement advisor for technical interview prep, STAR framework behavioral answers, and ATS resume optimization.
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="btn-clear-chat" onClick={handleClearHistory} title="Clear conversation history">
            🗑️ Clear History
          </button>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      {suggestedPrompts.length > 0 && (
        <div className="suggested-prompts-bar">
          <span className="prompts-label">✨ Quick Topics:</span>
          <div className="prompts-scroll">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                className="chip-prompt-btn"
                onClick={() => {
                  setCategory(p.category || 'GENERAL');
                  handleSendMessage(p.prompt, p.category || 'GENERAL');
                }}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="chat-window-card">
        <div className="chat-messages-scroll">
          {fetchingHistory ? (
            <div className="chat-loading-state">
              <div className="spinner"></div>
              <p>Loading your career consultation history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="empty-ai-icon">💡</div>
              <h3>How can I assist your placement preparation today?</h3>
              <p>
                Ask questions about algorithm strategies, behavioral interview structuring,
                resume bullet point refinement, or how to prepare for specific company hiring bars.
              </p>
              <div className="starter-grid">
                <div
                  className="starter-card"
                  onClick={() =>
                    handleSendMessage(
                      "How should I structure my answer to 'Tell me about yourself' for an SDE fresher role?",
                      'BEHAVIORAL'
                    )
                  }
                >
                  <span className="sc-icon">🎯</span>
                  <strong>'Tell Me About Yourself'</strong>
                  <p>Structure your 90-second self-introduction for high impact.</p>
                </div>
                <div
                  className="starter-card"
                  onClick={() =>
                    handleSendMessage(
                      'Explain the STAR method for behavioral interviews with an example.',
                      'BEHAVIORAL'
                    )
                  }
                >
                  <span className="sc-icon">🌟</span>
                  <strong>STAR Method Coaching</strong>
                  <p>Master Situation, Task, Action, and Result framing.</p>
                </div>
                <div
                  className="starter-card"
                  onClick={() =>
                    handleSendMessage(
                      'How can I optimize my software engineer resume bullet points for ATS scanners?',
                      'RESUME'
                    )
                  }
                >
                  <span className="sc-icon">📄</span>
                  <strong>ATS Resume Optimization</strong>
                  <p>Transform generic bullets into Google XYZ impact metrics.</p>
                </div>
                <div
                  className="starter-card"
                  onClick={() =>
                    handleSendMessage(
                      'What are the most frequent Dynamic Programming patterns asked in tech interviews?',
                      'DSA'
                    )
                  }
                >
                  <span className="sc-icon">⚡</span>
                  <strong>Top DP Patterns</strong>
                  <p>Focus on high-yield patterns covering 90% of interview rounds.</p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={msg.id || index} className="message-turn-wrapper">
                {/* User Prompt */}
                <div className="chat-bubble-row user-row">
                  <div className="chat-bubble user-bubble">
                    <p className="bubble-text">{msg.userPrompt}</p>
                    <span className="bubble-timestamp">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="avatar user-avatar-badge">👤</div>
                </div>

                {/* AI Response */}
                <div className="chat-bubble-row ai-row">
                  <div className="avatar ai-avatar-badge">🤖</div>
                  <div className="chat-bubble ai-bubble">
                    {msg.aiResponse ? (
                      <>
                        <div className="bubble-markdown-content">
                          {renderFormattedText(msg.aiResponse)}
                        </div>
                        <div className="bubble-actions">
                          <button
                            className="btn-copy-bubble"
                            onClick={() => copyToClipboard(msg.aiResponse, msg.id || index)}
                          >
                            {copiedId === (msg.id || index) ? '✓ Copied' : '📋 Copy Advice'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="ai-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    )}

                    {/* Suggestions below AI response */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="followup-suggestions">
                        <span className="followup-title">Explore next:</span>
                        <div className="followup-chips">
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              className="chip-followup"
                              onClick={() => handleSendMessage(sug, msg.category || 'GENERAL')}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          <div className="input-category-select">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="GENERAL">General Prep</option>
              <option value="BEHAVIORAL">Behavioral & HR</option>
              <option value="RESUME">Resume & ATS</option>
              <option value="DSA">DSA & Coding</option>
              <option value="COMPANY">Company Focus</option>
            </select>
          </div>
          <textarea
            className="chat-textarea"
            rows="2"
            placeholder="Ask anything about coding rounds, system design, resume review, or mock answers... (Press Enter to send)"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            className="btn-send-message"
            disabled={!inputPrompt.trim() || loading}
            onClick={() => handleSendMessage()}
          >
            {loading ? 'Thinking...' : 'Send 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;
