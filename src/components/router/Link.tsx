import type { ComponentProps } from "react";
import { Link as RouterLink } from "react-router-dom";

type AppLinkProps = Omit<ComponentProps<typeof RouterLink>, "to"> & {
  href: string;
};

export default function Link({ href, ...props }: AppLinkProps) {
  return <RouterLink to={href} {...props} />;
}
