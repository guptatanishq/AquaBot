'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Droplets, Paperclip, ImageIcon } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import Image from 'next/image';
import { Search } from 'lucide-react';

function IndustrySearchAutocomplete({ onSelect }: { onSelect: (val: string) => void }) {
  const [query, setQuery] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/industries')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setIndustries(d.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = query.trim() === '' 
    ? [] 
    : industries.filter(i => i.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

  return (
    <div className="flex flex-col gap-2 pt-2 pl-14 w-full">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-teal-600" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? "Loading industries..." : "Search industry..."}
          disabled={loading}
          className="w-full pl-9 pr-4 py-2 bg-white border border-teal-200 text-teal-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all shadow-sm"
        />
      </div>
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-teal-100 shadow-sm overflow-hidden flex flex-col mt-1">
          {filtered.map(ind => (
            <button 
              key={ind}
              onClick={() => onSelect(ind)}
              className="text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors border-b border-slate-50 last:border-b-0"
            >
              {ind}
            </button>
          ))}
        </div>
      )}
      {!loading && query.trim() !== '' && filtered.length === 0 && (
        <div className="text-sm text-slate-500 italic px-2">No matching industry found.</div>
      )}
    </div>
  );
}

function UnitSearchList({ options, selected, onToggle, disabled }: { 
  options: {id: string, name: string}[]; 
  selected: string[]; 
  onToggle: (id: string) => void; 
  disabled: boolean 
}) {
  const [query, setQuery] = useState('');
  const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="bg-white p-2 rounded-xl border border-teal-100 shadow-sm flex flex-col">
      <div className="relative mb-2 shrink-0">
        <Search className="absolute left-2.5 top-2 w-4 h-4 text-teal-600" />
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search locations/units..."
          disabled={disabled}
          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all disabled:opacity-50"
        />
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {filtered.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <label 
              key={opt.id} 
              className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                {isSelected && <svg className="w-3.5 h-3.5 text-white pointer-events-none" viewBox="0 0 14 14" fill="none"><path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"></path></svg>}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={isSelected}
                onChange={() => !disabled && onToggle(opt.id)}
                disabled={disabled}
              />
              <span className="text-sm font-medium text-slate-700 leading-snug">{opt.name}</span>
            </label>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-sm text-slate-500 italic p-2 text-center">No matching units found.</div>
        )}
      </div>
    </div>
  );
}

export default function AquaBot() {
  const { messages, handleSendMessage, isDone, isAwaitingPhoto, isAwaitingIndustry } = useChatbot();
  const [inputValue, setInputValue] = useState('');
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    handleSendMessage(inputValue);
    setInputValue('');
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  const handleMultiSelectToggle = (id: string) => {
    setSelectedMultiOptions(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const submitMultiSelect = (options: {id: string, name: string}[]) => {
    if (selectedMultiOptions.length === 0) return;
    const selectedNames = options
      .filter(o => selectedMultiOptions.includes(o.id))
      .map(o => o.name);
    handleSendMessage(selectedNames.join(', '), false, selectedMultiOptions);
    setSelectedMultiOptions([]); // reset
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleSendMessage(base64String, true);
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-lg h-[650px] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-teal-100 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 flex items-center space-x-3 text-white shrink-0 shadow-sm relative z-10">
        <div className="p-2 bg-white/20 rounded-full shadow-inner">
          <Droplets className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg leading-tight">AquaBot</h3>
          <p className="text-sm font-medium text-teal-50 opacity-90">Issue Reporting System</p>
        </div>
      </div>

      {/* Messages Layout */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50 relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500 via-transparent to-transparent"></div>
        
        {messages.map((msg) => (
          <div key={msg.id} className="relative z-10 flex flex-col space-y-2">
            <div className={`flex items-end space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              <div className={`p-2.5 rounded-full shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-teal-100 text-teal-700' : 'bg-teal-600 text-white'}`}>
                {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div 
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-[15px] shadow-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-teal-500 text-white rounded-br-sm' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'
                }`}
              >
                {msg.isImage ? (
                  <div className="flex flex-col space-y-2">
                    <span className="text-xs opacity-75 flex items-center"><ImageIcon className="w-3 h-3 mr-1"/> Uploaded Photo</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={msg.text} 
                      alt="User uploaded issue" 
                      className="max-w-full rounded-md max-h-48 object-cover border border-black/10"
                    />
                  </div>
                ) : (
                  msg.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))
                )}
              </div>
            </div>

            {/* Render Options if any */}
            {msg.options && (
              <div className="flex flex-wrap gap-2 pt-2 pl-14">
                {msg.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    disabled={isDone || msg.id !== messages[messages.length - 1].id}
                    className="px-4 py-2 bg-white border border-teal-200 text-teal-700 rounded-full text-sm font-medium hover:bg-teal-50 focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 transition-colors disabled:opacity-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Render MultiSelect Options if any */}
            {msg.isMultiSelect && msg.multiSelectOptions && (
              <div className="flex flex-col gap-2 pt-2 pl-14 w-full max-w-sm">
                <UnitSearchList 
                  options={msg.multiSelectOptions} 
                  selected={selectedMultiOptions} 
                  onToggle={handleMultiSelectToggle} 
                  disabled={isDone || msg.id !== messages[messages.length - 1].id} 
                />
                {msg.id === messages[messages.length - 1].id && !isDone && (
                  <button
                    onClick={() => submitMultiSelect(msg.multiSelectOptions!)}
                    disabled={selectedMultiOptions.length === 0}
                    className="mt-2 self-start px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-full text-sm font-medium hover:shadow-md focus:ring-2 focus:ring-offset-1 focus:ring-teal-500 transition-all disabled:opacity-50"
                  >
                    Confirm Selection
                  </button>
                )}
              </div>
            )}

            {/* Render Industry Search Autocomplete if any */}
            {msg.isIndustrySearch && msg.id === messages[messages.length - 1].id && !isDone && (
              <IndustrySearchAutocomplete onSelect={(val) => handleOptionClick(val)} />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      {!isAwaitingIndustry && (
        <div className="p-4 bg-white border-t border-slate-100 shrink-0 relative z-10 transition-all">
          <form onSubmit={onSubmit} className="flex items-center space-x-2">
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            
            <button
              type="button"
              disabled={!isAwaitingPhoto || isDone}
              onClick={() => fileInputRef.current?.click()}
              className={`p-3.5 rounded-full transition-all flex shrink-0 ${
                isAwaitingPhoto && !isDone 
                  ? 'bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-200 shadow-sm' 
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
              title="Upload Photo"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isAwaitingPhoto ? "Or skip uploading and type here..." : "Type your message..."}
              disabled={isDone}
              className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50 placeholder:text-slate-500 font-medium"
            />

            <button
              type="submit"
              disabled={(!inputValue.trim() && !isAwaitingPhoto) || isDone}
              className="p-3.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-full hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-all duration-200 transform shrink-0 active:scale-95"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>

          </form>
        </div>
      )}
    </div>
  );
}
