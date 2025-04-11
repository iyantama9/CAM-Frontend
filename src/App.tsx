import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  MessageCircle,
  UserPlus,
  LogIn,
  LogOut,
  AlertTriangle,
  Loader2,
  XCircle,
} from "lucide-react";
import { io, Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_CODE = import.meta.env.VITE_AUTH_CODE;

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.1 } },
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Particle = ({
  color,
  size,
  x,
  y,
}: {
  color: string;
  size: number;
  x: number;
  y: number;
}) => {
  const [position, setPosition] = useState({ x, y });
  const target = useRef({ x, y });
  const velocity = useRef({ x: 0, y: 0 });
  const attraction = 0.02;
  const friction = 0.85;

  useEffect(() => {
    target.current = { x, y };
  }, [x, y]);

  useEffect(() => {
    let animationFrameId: number;
    const moveParticle = () => {
      const dx = target.current.x - position.x;
      const dy = target.current.y - position.y;

      velocity.current.x += dx * attraction;
      velocity.current.y += dy * attraction;
      velocity.current.x *= friction;
      velocity.current.y *= friction;

      const newX = position.x + velocity.current.x;
      const newY = position.y + velocity.current.y;

      setPosition({ x: newX, y: newY });
      animationFrameId = requestAnimationFrame(moveParticle);
    };

    animationFrameId = requestAnimationFrame(moveParticle);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [position]);

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity: 0.6,
        boxShadow: `0 0 5px ${color}`,
        pointerEvents: "none",
      }}
    />
  );
};
const Star = ({
  color,
  size,
  x,
  y,
  twinkle,
}: {
  color: string;
  size: number;
  x: number;
  y: number;
  twinkle: boolean;
}) => {
  const [opacity, setOpacity] = useState(Math.random());

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (twinkle) {
      intervalId = setInterval(() => {
        setOpacity((prevOpacity) => {
          const change = (Math.random() - 0.5) * 0.3;
          let newOpacity = prevOpacity + change;
          newOpacity = Math.max(0.1, Math.min(1, newOpacity));
          return newOpacity;
        });
      }, Math.random() * 500 + 500);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [twinkle]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity: opacity,
        boxShadow: `0 0 ${size * 1.5}px ${color}`,
        pointerEvents: "none",
      }}
    />
  );
};

const ChatApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [particles, setParticles] = useState<
    { id: number; color: string; size: number; x: number; y: number }[]
  >([]);
  const particleTargetsRef = useRef<{
    [key: number]: { x: number; y: number };
  }>({});
  const [stars, setStars] = useState<
    {
      id: number;
      color: string;
      size: number;
      x: number;
      y: number;
      twinkle: boolean;
    }[]
  >([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (isLoggedIn && user) {
      if (!socket || !socket.connected) {
        console.log("Attempting to establish socket connection...");
        const newSocket = io(SOCKET_SERVER_URL, {
          withCredentials: true,
          transports: ["websocket", "polling"],
          query: { userId: user.id },
        });

        newSocket.on("connect", () => {
          console.log("Socket connected! ID:", newSocket.id);
          setIsConnected(true);
          setError(null);
          setSocket(newSocket);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          setIsConnected(false);
          if (reason !== "io client disconnect") {
            setError(
              "Terputus dari server chat. Mencoba menyambung kembali..."
            );
          }
        });

        newSocket.on("connect_error", (err: Error) => {
          console.error("Socket connection error:", err.message);
          setError(`Gagal terhubung (${err.message}). Coba refresh.`);
          setIsConnected(false);
          setLoading(false);
        });

        setSocket(newSocket);
      }
    } else {
      if (socket) {
        console.log("Disconnecting socket due to logout...");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }

    return () => {
      if (socket && socket.connected) {
        console.log(
          "Cleaning up socket connection on component unmount/re-render..."
        );
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (isLoggedIn && user && socket && isConnected) {
      console.log(
        `Socket connected (${socket.id}), setting up message listeners for user ${user.username}...`
      );
      setLoading(true);
      setError(null);
      console.log(`Emitting 'joinRoom' for user ${user.id}`);
      socket.emit("joinRoom", { userId: user.id });
      const initialMessagesHandler = (initialMessages: Message[]) => {
        console.log("Received initial messages:", initialMessages);
        setMessages(Array.isArray(initialMessages) ? initialMessages : []);
        setLoading(false);
      };
      socket.on("initialMessages", initialMessagesHandler);

      const messageHandler = (newMessage: Message) => {
        console.log("--- NEW MESSAGE RECEIVED ---", newMessage);
        if (
          newMessage?.id &&
          newMessage.userId &&
          newMessage.text &&
          newMessage.timestamp
        ) {
          setMessages((prevMessages) => {
            if (prevMessages.some((msg) => msg.id === newMessage.id)) {
              console.warn(
                `Duplicate message detected (ID: ${newMessage.id}), ignoring.`
              );
              return prevMessages;
            }
            console.log(`Adding new message (ID: ${newMessage.id})`);
            return [...prevMessages, newMessage];
          });
        } else {
          console.warn("Received invalid message data:", newMessage);
        }
      };
      socket.on("message", messageHandler);

      const errorHandler = (errorMessage: string) => {
        console.error("Server error received:", errorMessage);
        setError(errorMessage);
        setLoading(false);
      };
      socket.on("serverError", errorHandler);

      return () => {
        console.log(
          `Cleaning up message listeners for user ${user.username} (Socket ID: ${socket.id})...`
        );
        console.log(`Emitting 'leaveRoom' for user ${user.id}`);
        socket.emit("leaveRoom", { userId: user.id });
        socket.off("initialMessages", initialMessagesHandler);
        socket.off("message", messageHandler);
        socket.off("serverError", errorHandler);
        setLoading(false);
      };
    } else {
      setMessages([]);
      console.log(
        "User not logged in or socket not connected, message listeners inactive."
      );
      if (isLoggedIn && user && !isConnected) {
      }
    }
  }, [isLoggedIn, user, socket, isConnected]);

  const handleSendMessage = useCallback(() => {
    if (currentMessage.trim() && user && socket && isConnected) {
      const messageData = {
        userId: user.id,
        username: user.username,
        text: currentMessage.trim(),
      };
      console.log("Sending message:", messageData);

      socket.emit(
        "sendMessage",
        messageData,
        (ack: { success: boolean; message?: Message; error?: string }) => {
          if (ack.success && ack.message) {
            console.log("Message sent successfully, server ack:", ack.message);
          } else {
            console.error("Failed to send message:", ack.error);
            setError(ack.error || "Gagal mengirim pesan. Coba lagi.");
          }
        }
      );

      setCurrentMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }
    } else if (!isConnected) {
      setError("Tidak terhubung ke server. Tidak dapat mengirim pesan.");
    } else if (!currentMessage.trim()) {
      console.warn("Attempted to send empty message.");
    }
  }, [currentMessage, user, socket, isConnected]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password harus diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.userId && data.username) {
        console.log("Login successful:", data);
        setUser({ id: data.userId, username: data.username });
        setIsLoggedIn(true);
        setPassword("");
      } else {
        throw new Error(data.message || "Login gagal");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login gagal. Periksa username/password.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !email || !authCode) {
      setError("Semua field harus diisi untuk registrasi.");
      return;
    }
    if (authCode !== AUTH_CODE) {
      setError("Kode otentikasi salah. Silakan coba lagi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, authCode }),
      });
      const data = await response.json();
      if (response.ok && data.userId && data.username) {
        console.log("Registration successful:", data);
        setUser({ id: data.userId, username: data.username });
        setIsLoggedIn(true);
        setIsRegistering(false);
        setUsername("");
        setEmail("");
        setPassword("");
        setAuthCode("");
      } else {
        throw new Error(data.message || "Registrasi gagal");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registrasi gagal. Coba lagi.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log("Initiating logout...");
    setIsLoggedIn(false);
    setUser(null);
    setMessages([]);
    setUsername("");
    setPassword("");
    setEmail("");
    setAuthCode("");
    setError(null);
    if (socket) {
      console.log("Explicitly disconnecting socket on logout handler.");
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
    console.log("Logout process complete.");
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 100;
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(
        scrollHeight,
        maxHeight
      )}px`;
    }
  }, [currentMessage]);

  useEffect(() => {
    const numParticles = 30;
    const numStars = 150;
    const initialParticles = Array.from({ length: numParticles }, (_, i) => ({
      id: i,
      color: `rgba(100, 149, 237, ${0.3 + Math.random() * 0.3})`,
      size: Math.random() * 3 + 1,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
    }));
    setParticles(initialParticles);
    initialParticles.forEach((p) => {
      particleTargetsRef.current[p.id] = { x: p.x, y: p.y };
    });
    setStars(
      Array.from({ length: numStars }, (_, i) => ({
        id: i,
        color:
          Math.random() < 0.3
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(200, 200, 230, 0.6)",
        size: Math.random() * 2 + 0.5,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        twinkle: Math.random() > 0.2,
      }))
    );

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const attractRadius = 150;
      const repelForce = -0.05;
      Object.keys(particleTargetsRef.current).forEach((key) => {
        const id = parseInt(key, 10);
        const currentTarget = particleTargetsRef.current[id];
        if (!currentTarget) return;
        const dx = mouseX - currentTarget.x;
        const dy = mouseY - currentTarget.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < attractRadius && distance > 0) {
          const angle = Math.atan2(dy, dx);
          const moveX =
            Math.cos(angle) * repelForce * (attractRadius - distance);
          const moveY =
            Math.sin(angle) * repelForce * (attractRadius - distance);
          particleTargetsRef.current[id] = {
            x: currentTarget.x + moveX,
            y: currentTarget.y + moveY,
          };
        } else {
        }
      });
    };

    const handleResize = () => {
      setStars((prevStars) =>
        prevStars.map((s) => ({
          ...s,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        }))
      );
      const newParticles = Array.from({ length: numParticles }, (_, i) => ({
        id: i,
        color: `rgba(100, 149, 237, ${0.3 + Math.random() * 0.3})`,
        size: Math.random() * 3 + 1,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      }));
      setParticles(newParticles);
      particleTargetsRef.current = {};
      newParticles.forEach((p) => {
        particleTargetsRef.current[p.id] = { x: p.x, y: p.y };
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-blue-950 via-indigo-950 to-black flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((star) => (
          <Star key={`star-${star.id}`} {...star} />
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <Particle
            key={`particle-${p.id}`}
            {...p}
            x={particleTargetsRef.current[p.id]?.x ?? p.x}
            y={particleTargetsRef.current[p.id]?.y ?? p.y}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col flex-grow items-center justify-center">
        <header className="py-3 px-6 bg-black/30 backdrop-blur-md border-b border-white/10 flex items-center justify-between shadow-lg sticky top-0 z-20 w-full">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-400 animate-pulse" />
            <h1 className="text-xl font-bold text-white tracking-wide">
              Cah Apik Messenger
            </h1>
          </div>
          {isLoggedIn && user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300 hidden sm:inline">
                Masuk sebagai:{" "}
                <span className="font-semibold text-white">
                  {user.username}
                </span>
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600/80 hover:bg-red-600/100 text-white rounded-md transition-colors duration-200 border border-red-700/50 shadow-md h-auto"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </Button>
            </div>
          )}
        </header>

        <main className="flex-1 flex items-center justify-center p-4 overflow-y-auto w-full">
          {isLoggedIn && user ? (
            <Card className="w-full max-w-3xl flex flex-col h-[calc(100vh-220px)] sm:h-[calc(100vh-190px)] bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl overflow-hidden p-0 mt-16">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-500/80 text-white p-3 text-sm flex items-center gap-2 justify-between rounded-none border-0 border-b border-red-600/50 m-0 flex-shrink-0"
                >
                  <AlertTriangle className="h-5 w-5 inline mr-1 text-white flex-shrink-0" />
                  <AlertDescription className="flex-grow text-white">
                    {error}
                  </AlertDescription>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setError(null)}
                    className="text-white hover:text-red-200 hover:bg-transparent h-auto w-auto p-0 flex-shrink-0"
                  >
                    <XCircle size={18} />
                  </Button>
                </Alert>
              )}
              {!isConnected && !error && (
                <div className="bg-yellow-500/80 text-black p-2 text-xs text-center flex items-center justify-center gap-1 flex-shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin" /> Menyambungkan ke
                  server chat...
                </div>
              )}

              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="h-full w-full p-4">
                  {loading && messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-blue-300">
                      <Loader2 className="w-8 h-8 animate-spin mr-2" /> Memuat
                      pesan...
                    </div>
                  )}
                  {!loading && messages.length === 0 && !error && (
                    <div className="text-center text-gray-400 italic py-10">
                      Belum ada pesan. Mulai percakapan!
                    </div>
                  )}
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          variants={messageVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className={cn(
                            "flex flex-col",
                            message.userId === user.id
                              ? "items-end"
                              : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "p-3 rounded-lg max-w-[80%] sm:max-w-[70%] relative shadow-md break-words",
                              message.userId === user.id
                                ? "bg-blue-600/70 text-white rounded-br-none"
                                : "bg-gray-700/60 text-white rounded-bl-none"
                            )}
                          >
                            {message.userId !== user.id && (
                              <div className="text-xs text-blue-300 mb-1 font-semibold">
                                {message.username || "Pengguna"}
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">
                              {message.text}
                            </p>
                            <div className="text-xs text-gray-400 mt-1 text-right opacity-80">
                              {formatTimestamp(message.timestamp)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-3 border-t border-white/10 bg-black/30 flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-3 items-end w-full"
                >
                  <Textarea
                    ref={textareaRef}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ketik pesan Anda..."
                    className="flex-1 bg-gray-800/50 text-white border border-gray-600/50 rounded-md p-2 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:border-transparent scrollbar-thin scrollbar-thumb-blue-700/50 scrollbar-track-transparent min-h-[40px] h-auto"
                    rows={1}
                    style={{ maxHeight: "100px" }}
                    disabled={!isConnected || loading}
                  />
                  <Button
                    type="submit"
                    className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed self-end h-10 w-10 flex-shrink-0"
                    disabled={!currentMessage.trim() || !isConnected || loading}
                    size="icon"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md flex items-center justify-center"
            >
              <Card className="bg-black/60 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/10 space-y-6 w-full max-w-[450px]">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-3xl font-bold text-white text-center">
                    {isRegistering
                      ? "Buat Akun Baru"
                      : "Selamat Datang Kembali"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  {error && !isLoggedIn && (
                    <Alert
                      variant="destructive"
                      className="bg-red-500/30 text-red-300 p-3 rounded-md flex items-center gap-2 text-sm border border-red-500/50"
                    >
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-300" />
                      <AlertDescription className="flex-grow text-red-300">
                        {error}
                      </AlertDescription>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setError(null)}
                        className="ml-auto text-red-300 hover:text-red-100 hover:bg-transparent h-auto w-auto p-0"
                      >
                        <XCircle size={18} />
                      </Button>
                    </Alert>
                  )}
                  <form
                    onSubmit={isRegistering ? handleRegister : handleLogin}
                    className="space-y-4"
                  >
                    {isRegistering && (
                      <>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full px-4 py-2 bg-black/30 text-white border border-white/20 rounded-md placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0 focus:border-transparent transition-colors h-auto"
                        />
                        <Input
                          type="text"
                          placeholder="Kode Otorisasi"
                          value={authCode}
                          onChange={(e) => setAuthCode(e.target.value)}
                          required
                          className="w-full px-4 py-2 bg-black/30 text-white border border-white/20 rounded-md placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0 focus:border-transparent transition-colors h-auto"
                        />
                      </>
                    )}
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-black/30 text-white border border-white/20 rounded-md placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0 focus:border-transparent transition-colors h-auto"
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-black/30 text-white border border-white/20 rounded-md placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0 focus:border-transparent transition-colors h-auto"
                    />
                    <Button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg h-auto"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />{" "}
                          Memproses...
                        </>
                      ) : (
                        <>
                          {isRegistering ? (
                            <UserPlus className="w-5 h-5" />
                          ) : (
                            <LogIn className="w-5 h-5" />
                          )}{" "}
                          {isRegistering ? "Daftar" : "Login"}
                        </>
                      )}
                    </Button>
                  </form>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsRegistering((prev) => !prev);
                      setError(null);
                      setUsername("");
                      setPassword("");
                      setEmail("");
                      setAuthCode("");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 rounded-md transition-colors duration-200 h-auto bg-transparent"
                  >
                    {isRegistering ? (
                      <>
                        <LogIn className="w-4 h-4" /> Sudah punya akun? Login
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Belum punya akun?
                        Daftar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatApp;
