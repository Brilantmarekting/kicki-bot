import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, ChevronRight, AlertCircle, CheckCircle2, Package, RefreshCcw, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type Message = {
  id: string;
  role: "user" | "bot";
  content: string | React.ReactNode;
  type?: "text" | "component";
  componentData?: any;
  timestamp: Date;
};

type KickiState = "idle" | "listening" | "typing" | "speaking" | "empathy-mode" | "handoff-ready";

type QuickAction = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  intent: string;
};

// Mock Data
const QUICK_ACTIONS: QuickAction[] = [
  { id: "1", label: "¿Dónde está mi pedido?", icon: <Package className="w-4 h-4" />, intent: "order_status" },
  { id: "2", label: "Quiero devolver algo", icon: <RefreshCcw className="w-4 h-4" />, intent: "return_product" },
  { id: "3", label: "Producto roto/defectuoso", icon: <AlertCircle className="w-4 h-4" />, intent: "defective_product" },
  { id: "4", label: "Recomiéndame una rutina", icon: <CheckCircle2 className="w-4 h-4" />, intent: "routine_recommendation" },
  { id: "5", label: "Hablar con una persona", icon: <HeartHandshake className="w-4 h-4" />, intent: "human_handoff" },
];

export default function KickiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [kickiState, setKickiState] = useState<KickiState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Initial Greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setKickiState("typing");
      setTimeout(() => {
        addBotMessage("¡Hola! Soy Kicki. ¿Qué necesitas hoy?");
        setKickiState("idle");
      }, 1500);
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const addBotMessage = (content: string, componentData?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "bot",
      content,
      componentData,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    handleBotResponse(content);
  };

  const handleBotResponse = async (userInput: string) => {
    setKickiState("listening");
    setShowQuickActions(false);
    
    // Simulate processing delay
    setTimeout(() => {
      setKickiState("typing");
      setTimeout(() => {
        // Simple Intent Router Logic (Mock)
        const lowerInput = userInput.toLowerCase();
        
        if (lowerInput.includes("pedido") || lowerInput.includes("retraso")) {
          handleOrderDelayFlow();
        } else if (lowerInput.includes("devolver") || lowerInput.includes("devolución")) {
          handleReturnFlow();
        } else if (lowerInput.includes("roto") || lowerInput.includes("defectuoso")) {
          handleDefectiveProductFlow();
        } else if (lowerInput.includes("persona") || lowerInput.includes("agente")) {
          handleHandoffFlow();
        } else {
          addBotMessage("Entiendo. Para poder ayudarte mejor, ¿podrías elegir una de las opciones rápidas o darme más detalles?");
          setShowQuickActions(true);
          setKickiState("idle");
        }
      }, 2000);
    }, 1000);
  };

  // Flow Handlers
  const handleOrderDelayFlow = () => {
    setKickiState("empathy-mode");
    addBotMessage("Veo el retraso y entiendo la molestia. Voy a revisar el estado y te propongo la opción más rápida. ¿Me compartes tu número de pedido o el email de compra?");
    
    // Mocking the next step after user provides order ID
    const nextStep = (input: string) => {
      setKickiState("typing");
      setTimeout(() => {
        setKickiState("idle");
        addBotMessage("Gracias. He localizado tu pedido #KICK12345.");
        addBotMessage("El pedido está en el centro de distribución local, pero ha habido una incidencia logística. La nueva fecha de entrega estimada es mañana antes de las 14:00.");
        addBotMessage("He priorizado tu entrega con la agencia. ¿Te gustaría recibir notificaciones por SMS cuando salga a reparto?");
      }, 2000);
    };
    
    // We attach this temporary handler to the next user input (in a real app, this would be a state machine)
    // For this demo, we'll just simulate the flow if the user replies with something that looks like an ID or email
    // This is a simplification for the demo structure
  };

  const handleReturnFlow = () => {
    addBotMessage("Claro, puedo ayudarte con eso. Para empezar, ¿cuál es el motivo de la devolución?");
    
    // Mocking interactive components using text for now, or we could add custom component rendering
    setTimeout(() => {
      addBotMessage("Por favor, selecciona una opción:", {
        type: "chips",
        options: ["No me queda bien", "No es lo que esperaba", "Producto dañado", "Envío incorrecto"]
      });
    }, 500);
  };

  const handleDefectiveProductFlow = () => {
    setKickiState("empathy-mode");
    addBotMessage("Lamento mucho que tu producto haya llegado así. Vamos a solucionarlo ahora mismo.");
    
    setTimeout(() => {
      addBotMessage("Para poder gestionarlo rápidamente, ¿te importaría adjuntar una foto del producto? Solo necesito confirmar el estado.");
      // Mock upload consent
      addBotMessage("📷 [Simulación: El usuario sube una foto]");
      
      setTimeout(() => {
        setKickiState("speaking");
        addBotMessage("Gracias por la foto. Efectivamente, parece que se dañó en el transporte.");
        addBotMessage("Puedo enviarte un reemplazo sin coste que te llegará en 48h, o si lo prefieres, procesar un reembolso completo. ¿Qué prefieres?");
      }, 2500);
    }, 1500);
  };

  const handleHandoffFlow = () => {
    setKickiState("handoff-ready");
    const ticketId = "TICKET-" + Math.floor(Math.random() * 10000);
    
    addBotMessage(`Te conecto con una persona. No tendrás que repetir la información.`);
    
    // Simulate summary generation
    setTimeout(() => {
      const summary = (
        <div className="bg-secondary/50 p-3 rounded-lg border border-secondary-foreground/10 text-xs font-mono mt-2">
          <div className="font-bold mb-1 border-b border-secondary-foreground/10 pb-1 flex justify-between">
            <span>RESUMEN DE HANDOFF</span>
            <span>{ticketId}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-muted-foreground">Intención:</span>
            <span>Consulta General / Escalado</span>
            <span className="text-muted-foreground">Sentimiento:</span>
            <span className="text-orange-600 font-medium">Neutral/Frustrado</span>
            <span className="text-muted-foreground">Datos:</span>
            <span>Email: user@example.com</span>
            <span className="text-muted-foreground">Contexto:</span>
            <span>Usuario solicitó hablar con agente tras revisar opciones.</span>
          </div>
        </div>
      );
      
      // We need to adjust addBotMessage to accept React nodes or handle this differently
      // For this demo, we'll cast it to any to bypass the string type constraint temporarily
      // In a real app, the Message type would support ReactNode
      addBotMessage(summary as any);
    }, 1000);
  };

  const handleQuickAction = (action: QuickAction) => {
    addUserMessage(action.label);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    addUserMessage(inputValue);
    setInputValue("");
  };

  return (
    <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full md:w-[400px] h-[100dvh] md:h-[600px] bg-background/80 backdrop-blur-xl border border-border shadow-2xl rounded-none md:rounded-3xl overflow-hidden flex flex-col relative"
          >
            {/* Header / Avatar Area */}
            <div className="relative h-48 bg-gradient-to-b from-primary/10 to-transparent flex items-center justify-center shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 z-10 hover:bg-background/20 rounded-full"
                onClick={() => setIsOpen(false)}
              >
                <ChevronRight className="w-6 h-6 rotate-90 md:rotate-0 text-foreground/60" />
              </Button>
              
              <div className="relative z-0 flex flex-col items-center mt-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                    <AvatarImage src="/images/kicki_avatar.png" alt="Kicki" className="object-cover" />
                    <AvatarFallback>KB</AvatarFallback>
                  </Avatar>
                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-background transition-colors duration-500",
                    kickiState === "idle" && "bg-green-400",
                    kickiState === "listening" && "bg-blue-400 animate-pulse",
                    kickiState === "typing" && "bg-yellow-400 animate-bounce",
                    kickiState === "speaking" && "bg-purple-400",
                    kickiState === "empathy-mode" && "bg-pink-400",
                    kickiState === "handoff-ready" && "bg-orange-400"
                  )} />
                </div>
                <h3 className="mt-2 font-serif text-xl font-semibold text-foreground">Kicki</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Beauty Advisor</p>
              </div>
              
              {/* Background decoration */}
              <div className="absolute inset-0 bg-[url('/images/hero_bg.png')] opacity-20 dark:opacity-10 bg-cover bg-center mix-blend-overlay pointer-events-none" />
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4 bg-background/50" ref={scrollAreaRef}>
              <div className="space-y-4 pb-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex w-full",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card text-card-foreground border border-border rounded-tl-none backdrop-blur-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {kickiState === "typing" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-card p-3 rounded-2xl rounded-tl-none flex gap-1 items-center border border-border">
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Actions & Input */}
            <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border">
              <AnimatePresence>
                {showQuickActions && messages.length < 3 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:overflow-x-auto gap-2 pb-3 lg:no-scrollbar lg:mask-linear-fade"
                  >
                    {QUICK_ACTIONS.map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        className="rounded-full bg-card border-border hover:bg-primary/10 hover:border-primary/40 text-xs w-full sm:w-auto lg:whitespace-nowrap lg:shrink-0 transition-all duration-200"
                        onClick={() => handleQuickAction(action)}
                      >
                        {action.icon && <span className="mr-1.5">{action.icon}</span>}
                        {action.label}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 items-center mt-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 bg-card border-none rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/70 text-foreground"
                />
                <Button 
                  size="icon" 
                  className="rounded-full w-10 h-10 shrink-0 shadow-md hover:shadow-lg transition-all"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button (Idle State) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="relative group m-4 md:m-0"
          >
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
              <img 
                src="/images/kicki_avatar.png" 
                alt="Chat with Kicki" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
