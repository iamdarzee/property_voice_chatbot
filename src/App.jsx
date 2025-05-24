import React, { useState, useEffect, useCallback, useRef } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles} from "lucide-react";
import voiceService from "./services/voiceService";
import { generatePropertiesFromQuery } from "./services/openrouterService";
import "./App.css";

function App() {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [conversation, setConversation] = useState([]);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [conversation, currentProperty]);

  // Initialize voice service callbacks
  useEffect(() => {
    voiceService.onResult((transcript) => {
      setTranscript(transcript);
    });

    voiceService.onError((error) => {
      setError(`Voice recognition error: ${error}`);
      setIsListening(false);
    });

    voiceService.onStart(() => {
      setIsListening(true);
      setError("");
    });

    voiceService.onEnd(() => {
      setIsListening(false);
    });

    // Check if speech recognition is supported
    if (!voiceService.isSupported()) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
    }

    return () => {
      voiceService.stopListening();
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      const started = voiceService.startListening();
      if (!started) {
        setError(
          "Failed to start voice recognition. Please check microphone permissions."
        );
      }
    }
  }, [isListening]);

  const toggleConnection = useCallback(() => {
    if (isConnected) {
      setIsConnected(false);
      setConnectionStatus("disconnected");
      voiceService.stopListening();
      voiceService.stopSpeaking();
      setIsListening(false);
      setIsSpeaking(false);
      setConversation([]);
      setCurrentProperty(null);
      setSearchResults([]);
      setError("");
    } else {
      setIsConnected(true);
      setConnectionStatus("connecting");
      setError("");

      // Simulate connection with loading animation
      setTimeout(() => {
        setConnectionStatus("connected");
        const welcomeMessage = `Hello! I'm your AI real estate assistant. I have access to properties globally. You can ask me about any property type, location, or specific requirements. What would you like to know?`;
        addBotMessage(welcomeMessage);
        speak(welcomeMessage);

        // Focus input after connection
        setTimeout(() => {
          inputRef.current?.focus();
        }, 500);
      }, 1500);
    }
  }, [isConnected]);

  const speak = useCallback((text) => {
    // Split by numbered list or newlines for properties
    const lines = text.split(/\n+/).filter(Boolean);
    let idx = 0;

    function speakNext() {
      if (idx < lines.length) {
        voiceService.speak(lines[idx], {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            idx++;
            speakNext();
          },
          onError: (error) => {
            setError("Speech synthesis error.");
            setIsSpeaking(false);
          },
        });
      } else {
        setIsSpeaking(false);
      }
    }
    speakNext();
  }, []);

  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  }, []);

  const addUserMessage = (text) => {
    const message = {
      type: "user",
      text,
      timestamp: new Date(),
      id: Date.now() + Math.random(),
    };
    setConversation((prev) => [...prev, message]);
  };

  const addBotMessage = (text) => {
    const message = {
      type: "bot",
      text,
      timestamp: new Date(),
      id: Date.now() + Math.random(),
    };
    setConversation((prev) => [...prev, message]);
  };

  const typewriterEffect = (text, callback) => {
    setIsTyping(true);
    let index = 0;
    const tempMessage = {
      type: "bot",
      text: "",
      timestamp: new Date(),
      id: Date.now(),
    };
    setConversation((prev) => [...prev, tempMessage]);

    const timer = setInterval(() => {
      if (index < text.length) {
        setConversation((prev) => {
          const newConv = [...prev];
          newConv[newConv.length - 1].text = text.substring(0, index + 1);
          return newConv;
        });
        index++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        if (callback) callback();
      }
    }, 30);
  };

  const handleUserMessage = async (text) => {
    if (!text || !isConnected) return;

    addUserMessage(text);
    setIsLoading(true);

    try {
      // Use openrouter.ai for property search
      const results = await generatePropertiesFromQuery(text);
      setSearchResults(results);

      let response;
      if (results.length > 0) {
        response =
          "Here are some properties matching your request:\n\n" +
          results.map(formatPropertyLine).join("\n\n");
        setCurrentProperty(results[0]);
      } else {
        response =
          "Sorry, I couldn't find any properties matching your request. Try different keywords or locations.";
        setCurrentProperty(null);
      }

      setTimeout(() => {
        setIsLoading(false);
        typewriterEffect(response, () => {
          speak(response);
        });
      }, 800);
    } catch (error) {
      setIsLoading(false);
      const errorResponse =
        "I apologize, but I'm having trouble processing your request right now. Please try again.";
      addBotMessage(errorResponse);
    }
  };

  const handleInputChange = (e) => {
    setTranscript(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && transcript.trim() && !isLoading) {
      handleUserMessage(transcript.trim());
      setTranscript("");
    }
  };

  const handleSendClick = () => {
    if (transcript.trim() && !isLoading) {
      handleUserMessage(transcript.trim());
      setTranscript("");
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setCurrentProperty(null);
    setSearchResults([]);
    setError("");
  };

  // Status indicator component
  const StatusIndicator = ({ status }) => {
    const getStatusConfig = () => {
      switch (status) {
        case "connected":
          return { color: "#10b981", text: "Connected", pulse: true };
        case "connecting":
          return { color: "#f59e0b", text: "Connecting...", pulse: true };
        default:
          return { color: "#6b7280", text: "Disconnected", pulse: false };
      }
    };

    const config = getStatusConfig();

    return (
      <div className="status-bar">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: config.color,
              animation: config.pulse
                ? "statusPulse 2s ease-in-out infinite"
                : "none",
            }}
          />
          <span>Status: {config.text}</span>
        </div>
      </div>
    );
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="message-row bot">
      <div className="message-bubble" style={{ padding: "1rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span style={{ fontSize: "0.9rem", opacity: 0.7 }}>
            AI is thinking...
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{ minHeight: "100vh", background: "none", position: "relative" }}
    >
      <div className="floating-particles">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              position: "fixed",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.6)",
              animation: `float${i + 1} ${8 + i * 2}s ease-in-out infinite`,
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
              zIndex: -1,
            }}
          />
        ))}
      </div>

      <div className="app-card">
        <button
          className="connect-btn"
          onClick={toggleConnection}
          disabled={connectionStatus === "connecting"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {connectionStatus === "connecting" ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Connecting...
            </>
          ) : isConnected ? (
            <>
              <VolumeX size={20} />
              Disconnect
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Connect to AI Assistant
            </>
          )}
        </button>

        <div className="app-header">
          <h1 className="app-title">Property Search Assistant</h1>
          <div className="app-subtitle">
            🏠 Search, ask, and discover properties worldwide with AI
          </div>
        </div>

        <div className="conversation">
          {conversation.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.type}`}>
              {msg.type === "bot" ? (
                <pre
                  className="message-bubble"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.text}
                </pre>
              ) : (
                <div className="message-bubble">{msg.text}</div>
              )}
            </div>
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Current property highlight */}
        {currentProperty && (
          <div
            className="property-card slide-up"
            style={{ marginBottom: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <Sparkles size={16} style={{ color: "var(--accent-light)" }} />
              <span
                style={{
                  fontSize: "0.9rem",
                  color: "var(--accent-light)",
                  fontWeight: 600,
                }}
              >
                Featured Property
              </span>
            </div>
            <div className="property-title">{currentProperty.name}</div>
            <div className="property-meta">
              📍 {currentProperty.location} • {currentProperty.type}
            </div>
            <div className="property-price">💰 {currentProperty.price}</div>
            <div className="property-desc">{currentProperty.description}</div>
            {currentProperty.features && (
              <div className="property-features">
                {currentProperty.features.map((f, i) => (
                  <span key={i} className="property-feature">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* property cards scroll */}
        {searchResults.length > 1 && (
          <div className="property-cards-scroll fade-in">
            {searchResults.map((property, idx) => (
              <div
                className="property-card"
                key={idx}
                onClick={() => setCurrentProperty(property)}
                style={{ cursor: "pointer" }}
              >
                <div className="property-title">{property.name}</div>
                <div className="property-meta">
                  📍 {property.location} • {property.type}
                </div>
                <div className="property-price">💰 {property.price}</div>
                <div className="property-desc">{property.description}</div>
                {property.features && (
                  <div className="property-features">
                    {property.features.map((f, i) => (
                      <span key={i} className="property-feature">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* mickrophone control */}
        <div className="mic-row">
          <button
            className={`mic-btn${isListening ? " listening" : ""}`}
            onClick={toggleListening}
            disabled={!isConnected || isSpeaking || isLoading}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {isListening && (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <div className="voice-wave">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>
                Listening...
              </span>
            </div>
          )}

          {isSpeaking && (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Volume2 size={20} style={{ color: "var(--accent-light)" }} />
              <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>
                Speaking...
              </span>
              <button
                onClick={stopSpeaking}
                style={{
                  background: "transparent",
                  border: "1px solid var(--accent-color)",
                  borderRadius: "0.5rem",
                  padding: "0.2rem 0.5rem",
                  color: "var(--accent-color)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Stop
              </button>
            </div>
          )}
        </div>

        <div className="input-row">
          <input
            ref={inputRef}
            className="input-text"
            type="text"
            placeholder={
              isConnected
                ? "Ask about properties or use voice input..."
                : "Connect to start chatting"
            }
            value={transcript}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            disabled={!isConnected || isSpeaking || isLoading}
            autoFocus={isConnected}
          />
          <button
            className="input-btn"
            onClick={handleSendClick}
            title="Send Message"
            disabled={
              !transcript.trim() || !isConnected || isSpeaking || isLoading
            }
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        {/* Clear conversation button */}
        {conversation.length > 0 && (
          <button
            onClick={clearConversation}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              cursor: "pointer",
              marginTop: "1rem",
              transition: "var(--transition-smooth)",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "var(--accent-color)";
              e.target.style.color = "var(--accent-color)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
              e.target.style.color = "var(--text-secondary)";
            }}
          >
            Clear Conversation
          </button>
        )}

        {/* error display */}
        {error && (
          <div
            className="slide-up"
            style={{
              background: "rgba(248, 113, 113, 0.1)",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              borderRadius: "0.8rem",
              padding: "1rem",
              marginTop: "1rem",
              color: "#fca5a5",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            {error}
          </div>
        )}

        {/* status indicator */}
        <StatusIndicator status={connectionStatus} />
      </div>

      <div
        style={{
          textAlign: "center",
          color: "#9ca3af",
          fontSize: "14px",
          marginTop: "20px",
        }}
      >
        © {new Date().getFullYear()} Property Search Asistant • Developed by{" "}
        <a
          href="https://iamdarzee.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#60a5fa",
            textDecoration: "underline",
            transition: "color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#93c5fd")}
          onMouseLeave={(e) => (e.target.style.color = "#60a5fa")}
        >
          DARZEE
        </a>{" "}
      </div>

      {/* Additional CSS for animations */}
      <style jsx>{`
        .typing-dots {
          display: flex;
          gap: 0.2rem;
        }

        .typing-dots span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accent-color);
          animation: typingDot 1.4s ease-in-out infinite;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typingDot {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        .voice-wave {
          display: flex;
          gap: 0.15rem;
          align-items: center;
        }

        .voice-wave span {
          width: 3px;
          height: 15px;
          background: var(--accent-color);
          border-radius: 2px;
          animation: voiceWave 1s ease-in-out infinite;
        }

        .voice-wave span:nth-child(1) {
          animation-delay: 0s;
        }

        .voice-wave span:nth-child(2) {
          animation-delay: 0.1s;
        }

        .voice-wave span:nth-child(3) {
          animation-delay: 0.2s;
        }

        @keyframes voiceWave {
          0%,
          100% {
            height: 15px;
          }
          50% {
            height: 25px;
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        ${[...Array(6)]
          .map(
            (_, i) => `
          @keyframes float${i + 1} {
            0%, 100% {
              transform: translateY(0px) translateX(0px);
            }
            25% {
              transform: translateY(-20px) translateX(10px);
            }
            50% {
              transform: translateY(-10px) translateX(-5px);
            }
            75% {
              transform: translateY(-30px) translateX(15px);
            }
          }
        `
          )
          .join("")}
      `}</style>
    </div>
  );
}

export default App;

function formatPropertyLine(property, index) {
  return `${index + 1}. ${property.name} in ${property.location} - ${
    property.bedrooms
  } bedrooms, ${property.price}`;
}
