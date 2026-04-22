'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface TagInputProps {
    values: string[];
    onChange: (values: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
    hasError?: boolean;
}

export default function TagInput({ values, onChange, suggestions = [], placeholder = 'Type and press Enter', hasError = false }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !values.includes(trimmed)) {
            onChange([...values, trimmed]);
        }
        setInputValue('');
    };

    const removeTag = (tag: string) => {
        onChange(values.filter(v => v !== tag));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
            removeTag(values[values.length - 1]);
        }
    };

    const unusedSuggestions = suggestions.filter(s => !values.includes(s));

    return (
        <div>
            <div
                className={`flex flex-wrap items-center gap-1.5 p-2 min-h-[42px] border rounded-lg bg-white cursor-text transition-colors ${
                    hasError
                        ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-500/30 focus-within:border-red-400'
                        : 'border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-300'
                }`}
                onClick={() => inputRef.current?.focus()}
            >
                {values.map(tag => (
                    <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/50 hover:bg-indigo-100 transition-colors"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                            className="ml-0.5 hover:text-indigo-900 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={values.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[80px] border-0 shadow-none p-0 h-7 text-[13px] focus-visible:ring-0 focus-visible:border-0 placeholder:text-slate-400"
                />
            </div>
            {unusedSuggestions.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[11px] text-slate-400">Suggested:</span>
                    {unusedSuggestions.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => addTag(s)}
                            className="text-[11px] text-indigo-500 hover:text-indigo-700 hover:underline transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
