import { useMemo } from "react";
import { useLocation as useWouterLocation, useParams } from "wouter";
import type { ComponentProps, ReactNode } from "react";

type AppLinkProps = Omit<ComponentProps<"a">, "href"> & {
  to: string;
  children: ReactNode;
};

export function Link({ to, onClick, ...props }: AppLinkProps) {
  const [, setLocation] = useWouterLocation();
  return (
    <a
      href={to}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (props.target && props.target !== "_self") return;
        event.preventDefault();
        setLocation(to);
      }}
    />
  );
}

type NavLinkProps = Omit<AppLinkProps, "className"> & {
  end?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
};

export function NavLink({ to, end = false, className, ...props }: NavLinkProps) {
  const [location] = useWouterLocation();
  const isActive = end ? location === to : location === to || location.startsWith(`${to}/`);
  const resolvedClass = typeof className === "function" ? className({ isActive }) : className;
  return <Link to={to} className={resolvedClass} aria-current={isActive ? "page" : undefined} {...props} />;
}

export function useNavigate() {
  const [, setLocation] = useWouterLocation();
  return (to: string, options?: { replace?: boolean }) => setLocation(to, options);
}

export function useLocation() {
  const [pathname] = useWouterLocation();
  return useMemo(() => ({ pathname }), [pathname]);
}

export { useParams };

export function useSearchParams(): [URLSearchParams] {
  const { pathname } = useLocation();
  return [useMemo(() => new URLSearchParams(window.location.search), [pathname])];
}

export function Outlet({ children }: ComponentProps<"div">) {
  return <>{children}</>;
}