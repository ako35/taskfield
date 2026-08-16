import "./FormMessage.css";

interface FormMessageProps {
  type: "error" | "success";
  children: string;
}

export function FormMessage({ type, children }: FormMessageProps) {
  return (
    <p
      className={type === "error" ? "form-error" : "form-success"}
      role={type === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
