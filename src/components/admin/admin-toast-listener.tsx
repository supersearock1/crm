"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function AdminToastListener() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const error = searchParams.get("error");

  useEffect(() => {
    if (message) {
      toast.success(decodeURIComponent(message));
    }
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [message, error]);

  return null;
}
