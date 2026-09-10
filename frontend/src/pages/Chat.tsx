import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { IconChat, IconSend, IconSpark, IconTrash } from "../components/icons";
import { Layout } from "../components/Layout";
import {
  createSession,
  deleteSession,
  listMessages,
  listSessions,
  sendMessage,
} from "../features/chat/api";

export function Chat() {
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessionsQuery = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: listSessions,
  });

  const sessions = sessionsQuery.data ?? [];
  // Deriva a sessão ativa em vez de sincronizar via efeito: evita precisar
  // de setState dentro de um useEffect só pra "seguir" o primeiro item
  // assim que a lista carrega.
  const activeSessionId = selectedSessionId ?? sessions[0]?.id ?? null;

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", activeSessionId],
    queryFn: () => listMessages(activeSessionId as number),
    enabled: activeSessionId !== null,
  });

  const createSessionMutation = useMutation({
    mutationFn: createSession,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setSelectedSessionId(session.id);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (selectedSessionId === id) setSelectedSessionId(null);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      sendMessage(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", activeSessionId],
      });
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    if (!input.trim() || activeSessionId === null) return;
    sendMessageMutation.mutate({ id: activeSessionId, content: input });
    setInput("");
  }

  return (
    <Layout>
      <h1 className="font-display mb-1 text-3xl font-bold">Chat IA</h1>
      <p className="mb-6 text-sm text-fg/50">
        Pergunte sobre suas finanças em linguagem natural.
      </p>

      <div className="glass grid h-[600px] grid-cols-1 gap-0 overflow-hidden rounded-2xl sm:grid-cols-[220px_1fr]">
        <div className="flex flex-col border-r border-fg/5">
          <div className="p-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => createSessionMutation.mutate()}
              className="btn-gradient w-full rounded-lg py-2 text-sm font-semibold text-black"
            >
              + Nova conversa
            </motion.button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <AnimatePresence initial={false}>
              {sessions.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`group mb-1 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                    activeSessionId === s.id
                      ? "bg-fg/10 text-fg"
                      : "text-fg/50 hover:bg-fg/5 hover:text-fg/80"
                  }`}
                >
                  <span className="truncate">
                    {s.title || "Nova conversa"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSessionMutation.mutate(s.id);
                    }}
                    className="hidden shrink-0 text-fg/30 hover:text-pink-400 group-hover:block"
                  >
                    <IconTrash className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {sessions.length === 0 && (
              <p className="px-3 py-2 text-xs text-fg/30">
                Nenhuma conversa ainda.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {activeSessionId === null ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-fg/30">
              <IconChat className="h-8 w-8" />
              <p className="text-sm">
                Crie uma conversa nova pra começar a perguntar.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        m.role === "user"
                          ? "btn-gradient text-black"
                          : "glass-strong text-fg/90"
                      }`}
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="glass-strong flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-fg/50">
                      <IconSpark className="h-3.5 w-3.5 animate-pulse" />
                      pensando...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="flex items-center gap-2 border-t border-fg/5 p-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Pergunte algo sobre suas finanças..."
                  className="flex-1 rounded-lg border border-fg/10 bg-fg/5 px-3 py-2 text-sm text-fg placeholder-fg/30 outline-none focus:border-accent-cyan/60"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending || !input.trim()}
                  className="btn-gradient flex h-9 w-9 items-center justify-center rounded-lg text-black disabled:opacity-40"
                >
                  <IconSend className="h-4 w-4" />
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
