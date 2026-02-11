import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/core/components/ui/pagination";

import { cn } from "../lib/utils";

export interface PaginationUIProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  getPageUrl: (page: number) => string;
  className?: string;
}

export default function PaginationUI({
  page,
  totalPages,
  onPageChange,
  getPageUrl,
  className,
}: PaginationUIProps) {
  return (
    <div className={cn(className)}>
      <Pagination>
        <PaginationContent>
          {page > 1 && (
            <>
              <PaginationItem>
                <PaginationPrevious
                  to={getPageUrl(page - 1)}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page - 1);
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  to={getPageUrl(page - 1)}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page - 1);
                  }}
                >
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationLink
              to={getPageUrl(page)}
              isActive
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page);
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>

          {page < totalPages && (
            <>
              <PaginationItem>
                <PaginationLink
                  to={getPageUrl(page + 1)}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page + 1);
                  }}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
              {page + 1 < totalPages && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  to={getPageUrl(page + 1)}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page + 1);
                  }}
                />
              </PaginationItem>
            </>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
