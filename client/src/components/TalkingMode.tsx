import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function TalkingMode() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoState, setVideoState] = useState<"idle" | "talk">("idle");
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const stopListening = () => {
    console.log("🛑 Stopping...");
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsListening(false);
    setVideoState("idle");
  };

  const startListening = async () => {
    console.log("▶️ Starting...");
    
    try {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Connected");
        setVideoState("talk");
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("📩 Message:", data);

        if (data.type === "stt_final" && data.text?.trim()) {
          console.log("📝 You said:", data.text);
          setMessages((prev) => [...prev, { role: "user", content: data.text }]);
          setIsProcessing(true);

          try {
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: data.text }),
            });

            const result = await response.json();
            console.log("💬 Kicki says:", result.reply);

            if (result.reply) {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: result.reply },
              ]);
            }
          } catch (error) {
            console.error("❌ Error:", error);
          } finally {
            setIsProcessing(false);
          }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          ws.send(pcmData.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log("🎤 Listening...");
      setIsListening(true);

    } catch (error) {
      console.error("❌ Failed:", error);
      stopListening();
    }
  };

  const handleClick = () => {
    console.log("🖱️ Button clicked! isListening =", isListening);
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = `/videos/kicki_fullbody_${videoState}.mp4`;
      videoRef.current.load();
      videoRef.current.play().catch(console.error);
    }
  }, [videoState]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e1b4b 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      {/* Video */}
      <div style={{
        width: "320px",
        height: "400px",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        border: "4px solid rgba(168, 85, 247, 0.3)",
        marginBottom: "30px",
        position: "relative"
      }}>
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loop
          muted
          playsInline
          autoPlay
        />
        
        {/* Status */}
        <div style={{
          position: "absolute",
          top: "-8px",
          right: "-8px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: "4px solid #1e1b4b",
          background: isListening ? "#ef4444" : isProcessing ? "#eab308" : "#22c55e",
          animation: isListening || isProcessing ? "pulse 2s infinite" : "none"
        }} />
      </div>

      {/* Button */}
      <button
        onClick={handleClick}
        disabled={isProcessing}
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          border: "none",
          background: isListening ? "#ef4444" : "#a855f7",
          boxShadow: `0 10px 30px ${isListening ? "rgba(239, 68, 68, 0.5)" : "rgba(168, 85, 247, 0.5)"}`,
          cursor: isProcessing ? "not-allowed" : "pointer",
          transition: "all 0.3s",
          marginBottom: "30px",
          opacity: isProcessing ? 0.5 : 1,
          transform: "scale(1)"
        }}
        onMouseEnter={(e) => {
          if (!isProcessing) e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <svg
          style={{ width: "32px", height: "32px", color: "white" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>

      {/* Messages */}
      <div style={{
        width: "100%",
        maxWidth: "600px",
        background: "rgba(30, 27, 75, 0.5)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        maxHeight: "300px",
        overflowY: "auto"
      }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af" }}>
            Click the microphone to start...
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div style={{
                  maxWidth: "80%",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  background: msg.role === "user" ? "#a855f7" : "#334155",
                  color: "white"
                }}>
                  <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                    {msg.role === "user" ? "You" : "Kicki"}
                  </p>
                  <p style={{ margin: 0 }}>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isProcessing && (
        <div style={{
          marginTop: "16px",
          color: "#d8b4fe",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>Kicki is thinking...</span>
        </div>
      )}
    </div>
  );
}

export default TalkingMode;