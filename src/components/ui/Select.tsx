'use client';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}

export const Select = ({
  label,
  error,
  options,
  fullWidth = false,
  className = '',
  id,
  ...props
}: SelectProps) => {
  const selectId = id || Math.random().toString(36).substring(2, 9);
  
  const baseSelectStyles = 'rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/30 focus:ring-opacity-50';
  const errorSelectStyles = error ? 'border-danger focus:border-danger focus:ring-danger/30' : '';
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthStyle} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`${baseSelectStyles} ${errorSelectStyles} ${widthStyle}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};
