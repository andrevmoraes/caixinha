export default function SectionCard({ 
  title, 
  children, 
  action, 
  actionLabel,
  className = '' 
}) {
  return (
    <div className={`overflow-x-hidden ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[var(--color-marinho-itau)] tracking-wide">
            {title}
          </h3>
          {action && actionLabel && (
            <button
              onClick={action}
              className="text-sm font-semibold text-[var(--color-laranja-itau)] hover:text-orange-700 transition"
            >
              {actionLabel} →
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
