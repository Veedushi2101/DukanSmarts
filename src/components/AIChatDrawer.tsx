import React, { useState } from "react";
import { Sparkles, Send, X, Bot, User, Brain, RefreshCw } from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";

export const AIChatDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "ai" | "user"; text: string; time: string }>>([
    {
      sender: "ai",
      text: "Namaste Rajesh ji! I'm DukanSmarts, your Kirana copilot. I am actively tracking your live inventory and customer orders. How can I assist you today?",
      time: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { products, customers } = useInventory();

  // Construct dynamic store grounding context
  const buildLivePromptContext = () => {
    const productCatalog = products
      .map(
        (p) =>
          `- ${p.productName}: Stock = ${p.currentStock}, Reorder Alert Level = ${p.reorderLevel}, Price = ₹${
            p.sellingPrice || p.mrp || 0
          }, Category = ${p.category}`
      )
      .join("\n");

    const outOfStock = products.filter((p) => p.currentStock <= 0).map((p) => p.productName);
    const lowStock = products
      .filter((p) => p.currentStock > 0 && p.currentStock <= p.reorderLevel)
      .map((p) => `${p.productName} (${p.currentStock} remaining)`);
    const highStock = [...products]
      .sort((a, b) => b.currentStock - a.currentStock)
      .slice(0, 3)
      .map((p) => `${p.productName} (${p.currentStock} in stock)`);

    return `
You are DukanSmarts Assistant, an AI inventory manager for Rajesh Kumar's Kirana Store.
Answer the user's questions accurately based ONLY on this live store data:

CURRENT STORE INVENTORY:
${productCatalog}

CURRENT SUMMARY:
- Zero Stock (Out of Stock): ${outOfStock.length > 0 ? outOfStock.join(", ") : "None currently out of stock"}
- Low Stock Items: ${lowStock.length > 0 ? lowStock.join(", ") : "All items have sufficient stock"}
- Highest Stock Items: ${highStock.join(", ")}
- Total Registered Customers: ${customers.length}

INSTRUCTIONS:
1. If asked "what is not there in stock" or out of stock, list items with 0 stock. If none have 0 stock, explicitly mention that no item is completely out of stock, but list items that are close to running out (low stock).
2. If asked "what is more in stock" or high stock, highlight the products with the highest stock counts.
3. Keep answers concise, polite, and directly relevant to an Indian Kirana shop owner.
`;
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: textToSend, time: timeStr }]);
    setLoading(true);

    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

    try {
      if (!groqApiKey) {
        throw new Error("API key not configured");
      }

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: buildLivePromptContext() },
            ...messages.slice(-4).map((m) => ({
              role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
              content: m.text
            })),
            { role: "user", content: textToSend }
          ],
          temperature: 0.2,
          max_tokens: 300
        })
      });

      if (!res.ok) {
        throw new Error(`Groq HTTP ${res.status}`);
      }

      const data = await res.json();
      const aiReply = data.choices?.[0]?.message?.content?.trim() || "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      // Dynamic local fallback if Groq API is offline or key is invalid
      const query = textToSend.toLowerCase();
      let fallback = "";

      if (query.includes("not") || query.includes("out") || query.includes("empty") || query.includes("zero")) {
        const out = products.filter((p) => p.currentStock <= 0);
        if (out.length > 0) {
          fallback = `Currently out of stock: ${out.map((p) => p.productName).join(", ")}.`;
        } else {
          const low = products.filter((p) => p.currentStock <= p.reorderLevel);
          fallback = `No items are completely out of stock. However, these are running low: ${low
            .map((p) => `${p.productName} (${p.currentStock} left)`)
            .join(", ")}.`;
        }
      } else if (query.includes("more") || query.includes("highest") || query.includes("max") || query.includes("surplus")) {
        const top = [...products].sort((a, b) => b.currentStock - a.currentStock).slice(0, 3);
        fallback = `Items with the most stock: ${top
          .map((p) => `${p.productName} (${p.currentStock} in stock)`)
          .join(", ")}.`;
      } else {
        const low = products.filter((p) => p.currentStock <= p.reorderLevel);
        fallback = `Currently monitoring ${products.length} products. Items needing attention: ${
          low.length > 0 ? low.map((p) => p.productName).join(", ") : "None. All stock levels healthy!"
        }.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: fallback,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
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
        className="fixed bottom-6 right-6 z-40 bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80 transition-all transform hover:scale-105 group cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-4 h-4" />
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
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">DukanSmarts Assistant</h3>
                  <p className="text-[10px] text-emerald-400 font-medium">Groq Llama-3.1 & Kirana Engine Active</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions Chips */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
              <button
                onClick={() => handleSend("What is not there in stock?")}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer"
              >
                ⚠️ Check Out of Stock
              </button>
              <button
                onClick={() => handleSend("What is more in stock?")}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer"
              >
                📦 Check Highest Stock
              </button>
              <button
                onClick={() => handleSend("Give me a quick summary of inventory health")}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer"
              >
                📊 Store Summary
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
                    <p className="whitespace-pre-line">{m.text}</p>
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
                <div className="flex gap-2.5 items-center text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-52 shadow-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Checking live stock counts...</span>
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
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer"
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