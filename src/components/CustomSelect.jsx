import { useEffect, useRef, useState } from 'react';

export default function CustomSelect({ id, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const selected = options.find(o => o.value === value);
  const label = selected ? selected.label : (options[0]?.label || '');

  return (
    <div className="custom-select" ref={wrapperRef} data-select-id={id}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
      >
        <span className="custom-select-value">{label}</span>
        <i className="fa-solid fa-chevron-down custom-select-arrow" />
      </button>
      {open && (
        <div className="custom-select-dropdown">
          {options.map(opt => (
            <button
              type="button"
              key={String(opt.value)}
              className={`custom-select-option${opt.value === value ? ' is-selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
