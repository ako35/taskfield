import { Eye, EyeOff } from "lucide-react";
import type { ComponentProps } from "react";
import "./PasswordField.css";

interface PasswordFieldProps extends Omit<ComponentProps<"input">, "type"> {
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  showLabel?: string;
  hideLabel?: string;
}

export function PasswordField({
  visible,
  onVisibilityChange,
  showLabel = "Parolayı göster",
  hideLabel = "Parolayı gizle",
  ...inputProps
}: PasswordFieldProps) {
  return (
    <div className="password-field">
      <input {...inputProps} type={visible ? "text" : "password"} />
      <button
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        onClick={() => onVisibilityChange(!visible)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
