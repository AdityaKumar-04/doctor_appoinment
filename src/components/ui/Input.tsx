import React, { memo } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onIconRightClick?: () => void;
  containerClassName?: string;
}

const Input = memo(({
  label,
  error,
  hint,
  icon,
  iconRight,
  onIconRightClick,
  containerClassName = "",
  className = "",
  id,
  ...props
}: InputProps) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]"
        >
          {label}
        </label>
      )}

      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors pointer-events-none flex items-center justify-center">
             {typeof icon === 'string' ? (
                <span className="material-symbols-outlined text-lg">{icon}</span>
             ) : (
                icon
             )}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-white/[0.03] border rounded-xl text-sm text-white font-medium
            placeholder:text-slate-600 transition-all duration-300
            focus:outline-none focus:ring-4 focus:ring-teal-500/10
            disabled:opacity-40 disabled:cursor-not-allowed
            ${icon ? "pl-11" : "pl-4"} ${iconRight ? "pr-11" : "pr-4"} py-3.5
            ${
              error
                ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/5"
                : "border-white/10 focus:border-teal-500/40 hover:border-white/20"
            }
            ${className}
          `}
          {...props}
        />
        {iconRight && (
          <button
            type="button"
            onClick={onIconRightClick}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1 flex items-center justify-center"
          >
            {typeof iconRight === 'string' ? (
               <span className="material-symbols-outlined text-lg">{iconRight}</span>
            ) : (
               iconRight
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-[11px] text-red-400 font-bold flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{hint}</p>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";
export default Input;

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = memo(({
  label,
  error,
  hint,
  containerClassName = "",
  className = "",
  id,
  ...props
}: TextareaProps) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full bg-white/[0.03] border rounded-xl text-sm text-white font-medium px-4 py-4
          placeholder:text-slate-600 transition-all duration-300 resize-none min-h-[120px]
          focus:outline-none focus:ring-4 focus:ring-teal-500/10
          disabled:opacity-40
          ${
            error
              ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/5"
              : "border-white/10 focus:border-teal-500/40 hover:border-white/20"
          }
          ${className}
        `}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-red-400 font-bold flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{hint}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = "Textarea";
