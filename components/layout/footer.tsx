'use client';

import * as React from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <Link
              href="https://github.com/ableandwilling"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              David Gilardi
            </Link>
            . The source code is available on{" "}
            <Link
              href="https://github.com/ableandwilling/codebeasts"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </Link>
            .
          </p>
        </div>
        <ModeToggle />
      </div>
    </footer>
  );
} 