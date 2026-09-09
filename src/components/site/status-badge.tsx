import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS } from "@/lib/constants";
import type { BookingStatus } from "@prisma/client";

export function StatusBadge({ status, customerFacing = false }: { status: BookingStatus; customerFacing?: boolean }) {
  const meta = BOOKING_STATUS[status];
  return <Badge variant={meta.tone}>{customerFacing ? meta.customer : meta.label}</Badge>;
}
