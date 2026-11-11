import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslations } from "@/i18n";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useState, type ComponentProps } from "react";

/** Password field with a show/hide toggle. Spread `register(...)` onto it. */
export default function PasswordInput(
  props: Omit<ComponentProps<typeof InputGroupInput>, "type">,
) {
  const t = useTranslations("auth.fields");
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput {...props} type={visible ? "text" : "password"} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          className="text-gray-500 dark:text-gray-400"
        >
          {visible ? (
            <EyeIcon className="fill-current" />
          ) : (
            <EyeCloseIcon className="fill-current" />
          )}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
