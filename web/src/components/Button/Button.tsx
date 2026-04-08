interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  return (
    <div
      role="button"
      onClick={onClick}
      className="border-border hover:bg-surface-hover flex h-12 w-fit items-center justify-center rounded-full border border-solid px-5 transition-colors hover:border-transparent"
    >
      {children}
    </div>
  );
}
