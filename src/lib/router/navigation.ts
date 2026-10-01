import { useLocation, useNavigate, useSearchParams as useRouterSearchParams } from "react-router-dom";

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

export function useRouter() {
  const navigate = useNavigate();

  return {
    push(href: string) {
      navigate(href);
    },
    replace(href: string, _options?: { scroll?: boolean }) {
      navigate(href, { replace: true });
    },
    refresh() {
      // Data screens load their own state. There is no server render to refresh.
    },
    back() {
      navigate(-1);
    },
  };
}
