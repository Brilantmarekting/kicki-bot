import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface TalkingModeProps {
  onClose: () => void;
}

export default function TalkingMode({ onClose }: TalkingModeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedRef = useRef<string>("");
const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      const ws = new WebSocket("ws://localhost:3001/ws");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Connected");
        setVideoState("talk");
      };

   ws.onmessage = async (event) => {
  const data = JSON.parse(event.data);
  console.log("📩 Message:", data);

  if ((data.type === "stt_final" || data.type === "transcript") && data.text?.trim()) {
  if (isProcessing) return;
  
  console.log("📝 You said:", data.text);
  setMessages((prev) => [...prev, { role: "user", content: data.text }]);
  setIsProcessing(true);

  try {
    console.log("📤 Calling OpenAI...");
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: data.text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("💬 Kicki says:", result.reply);

    if (result.reply) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply },
      ]);

      // Generate and play TTS
      try {
        console.log("🔊 Requesting TTS...");
        const ttsResponse = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: result.reply }),
        });

        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          console.log("🔊 Playing audio...");
          setVideoState("talk");
          await audio.play();
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setVideoState("idle");
            console.log("✅ Audio finished");
          };
        } else {
          console.error("❌ TTS failed:", await ttsResponse.text());
        }
      } catch (ttsError) {
        console.error("❌ TTS error:", ttsError);
      }
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
      alert("No se pudo acceder al micrófono. Por favor permite el acceso al micrófono.");
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

  const handleClose = () => {
    stopListening();
    onClose();
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
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Video */}
      <div className="relative mb-8">
        <div className="w-80 h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-purple-500/30">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            autoPlay
          />
        </div>
        
        {/* Status indicator */}
        <div className="absolute -top-2 -right-2">
          <div className={`w-6 h-6 rounded-full border-4 border-slate-900 ${
            isListening ? 'bg-red-500 animate-pulse' : 
            isProcessing ? 'bg-yellow-500 animate-pulse' : 
            'bg-green-500'
          }`} />
        </div>
      </div>

      {/* Button */}
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={`mb-8 p-6 rounded-full transition-all duration-300 transform hover:scale-110 ${
          isListening
            ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
            : "bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/50"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <svg
          className="w-8 h-8 text-white"
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
      <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-2xl max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">
            Haz clic en el micrófono y empieza a hablar...
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-gray-100"
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {msg.role === "user" ? "Tú" : "Kicki"}
                  </p>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="mt-4 text-purple-300 flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          <span className="ml-2">Kicki está pensando...</span>
        </div>
      )}
    </div>
  );
}