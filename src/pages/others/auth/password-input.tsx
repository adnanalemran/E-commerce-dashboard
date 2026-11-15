import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslations } from "@/i18n";
import { EyeCloseIcon, EyeIcon, LockIcon } from "@/icons";
import { useState, type ComponentProps } from "react";

/** Password field with leading lock icon and show/hide toggle. */
export default function PasswordInput(
  props: Omit<ComponentProps<typeof InputGroupInput>, "type">,
) {
  const t = useTranslations("auth.fields");
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup className="rounded-xl border-gray-300/80 bg-gray-50/50 transition-all hover:bg-white focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-gray-700/80 dark:bg-gray-800/40 dark:hover:bg-gray-800/60 dark:focus-within:bg-gray-900">
      <InputGroupAddon
        align="inline-start"
        className="text-gray-400 dark:text-gray-500"
      >
        <LockIcon className="size-4" />
      </InputGroupAddon>
      <InputGroupInput {...props} type={visible ? "text" : "password"} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200"
        >
          {visible ? (
            <EyeIcon className="size-4 fill-current" />
          ) : (
            <EyeCloseIcon className="size-4 fill-current" />
          )}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
