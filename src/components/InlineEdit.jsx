import { useEffect, useRef, useState } from 'react';

export default function InlineEdit({ value, field, onSave, type = 'text', format }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setInputValue(value);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, value]);

  function finish() {
    const newValue = inputValue.trim();
    setEditing(false);
    if (newValue && newValue !== String(value)) {
      const parsed = type === 'number' ? parseFloat(newValue) : newValue;
      if (type === 'number' && isNaN(parsed)) return;
      onSave(field, parsed);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type === 'number' ? 'number' : 'text'}
        step={type === 'number' ? '0.01' : undefined}
        className="inline-edit"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onBlur={finish}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); finish(); }
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <div
      style={{ cursor: 'text' }}
      onClick={() => setEditing(true)}
      title="اضغط للتعديل"
    >
      {format ? format(value) : value}
    </div>
  );
}
