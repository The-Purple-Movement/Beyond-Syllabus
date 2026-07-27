import Link from "next/link";
import { Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BreadcrumbsProps } from "@/lib/types";

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // On phones the full trail does not fit; a single "back one level" link
  // beats no navigation at all (which is what hidden md:flex used to mean).
  const parent = [...items].reverse().find((item, i) => i > 0 && item.href);

  return (
    <nav aria-label="Breadcrumb">
      {parent && (
        <Link
          href={parent.href!}
          className="md:hidden inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {parent.label}
        </Link>
      )}
      <ol className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            <li>
              {item.href ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-[hsl(var(--primary))]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
              )}
            </li>
            {index < items.length - 1 && (
              <li>
                <ChevronRight className="h-4 w-4 text-[hsl(var(--primary))]" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
