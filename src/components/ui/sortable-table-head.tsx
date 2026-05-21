"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";

type SortDirection = "asc" | "desc";

type SortableTableHeadProps = {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  className?: string;
};

export function SortableTableHead({ label, active, direction, onClick, className }: SortableTableHeadProps) {
  const icon = !active ? (
    <ArrowUpDown size={14} className="text-gray-400" />
  ) : direction === "asc" ? (
    <ArrowUp size={14} className="text-amber-600" />
  ) : (
    <ArrowDown size={14} className="text-amber-600" />
  );

  return (
    <TableHead
      className={className}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-left text-sm font-medium text-gray-700 transition hover:text-amber-700"
      >
        <span>{label}</span>
        {icon}
      </button>
    </TableHead>
  );
}