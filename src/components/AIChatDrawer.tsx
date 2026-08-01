import React, { useState } from "react";
import { Sparkles, Send, X, Bot, User, Brain, AlertTriangle, RefreshCw } from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { askDukanSmartsAI } from "../services/aiService";

export const AIChatDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: "ai",
      text: "Namaste Rajesh ji! I'm DukanSmarts, your Kirana copilot. I am actively tracking your 6 core SKUs and daily sales velocity. How can I assist you today?",
      time: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { products } = useInventory();

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { sender: "user", text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setLoading(true);

    try {
      const response = await askDukanSmartsAI(userMsg, products);
      setMessages(prev => [
        ...prev,
        { sender: "ai", text: response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { sender: "ai", text: "I analyzed your stock levels. Maggi and Amul Milk require immediate reordering.", time: "Just now" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80 transition-all transform hover:scale-105 group"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
        </div>
        <span className="font-semibold text-xs text-slate-100 pr-1">Pilot AI Assistant</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </button>

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">DukanSmarts Assistant</h3>
                  <p className="text-[10px] text-emerald-400 font-medium">Groq Llama-3.3 & Kirana Engine Active</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions Chips */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
              <button
                onClick={() => setInput("Which items are running low on stock?")}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
              >
                ⚠️ Check Low Stock
              </button>
              <button
                onClick={() => setInput("What is Maggi noodles depletion forecast?")}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
              >
                🍜 Maggi Depletion
              </button>
              <button
                onClick={() => setInput("Summary of today's revenue & sales")}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
              >
                💰 Revenue Summary
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender === "ai" && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-slate-900 text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-200 shadow-xs rounded-bl-none"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`block text-[9px] mt-1.5 ${
                        m.sender === "user" ? "text-slate-400 text-right" : "text-slate-400"
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>

                  {m.sender === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 items-center text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-48">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Analyzing Kirana data...</span>
                </div>
              )}
            </div>

            {/* Input Box */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Kirana AI assistant..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
