import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircleIcon, OctagonAlertIcon } from "@/icons";
import type { ReactNode } from "react";

export interface FormAlertProps {
  variant?: "destructive" | "success";
  title?: string;
  children?: ReactNode;
  className?: string;
}

export default function FormAlert({
  variant = "destructive",
  title,
  children,
  className,
}: FormAlertProps) {
  const Icon = variant === "success" ? CheckCircleIcon : OctagonAlertIcon;

  return (
    <Alert variant={variant} className={className ?? "p-4"}>
      <Icon className="size-5" />
      {title && <AlertTitle className="text-sm">{title}</AlertTitle>}
      {children && <AlertDescription>{children}</AlertDescription>}
    </Alert>
  );
}
