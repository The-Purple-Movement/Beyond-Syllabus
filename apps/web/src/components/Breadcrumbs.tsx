import Link from "next/link";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { BreadcrumbsProps } from "@/types";

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
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
