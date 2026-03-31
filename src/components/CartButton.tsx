import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CartButtonProps {
  onClick?: () => void;
  className?: string;
  showLabel?: boolean;
  /** When user clicks "Proceed to checkout" (e.g. open auth modal if not logged in) */
  onProceedToCheckout?: () => void;
}

export function CartButton({ onClick, className, showLabel, onProceedToCheckout }: CartButtonProps) {
  const { count, items, getCartTotal, removeItem } = useCart();

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className={`relative p-2 ${className ?? ""}`}
      onClick={onClick}
      aria-label={`Booking cart, ${count} item${count !== 1 ? "s" : ""}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 text-white text-[10px] font-semibold px-1">
          {count > 99 ? "99+" : count}
        </span>
      )}
      {showLabel && <span className="ml-1.5 text-sm">Cart {count > 0 ? `(${count})` : ""}</span>}
    </Button>
  );

  const content = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Booking tray{count > 0 ? ` · ${count} item${count !== 1 ? "s" : ""}` : ""}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (onProceedToCheckout != null) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-0">
          <div className="p-3 border-b">
            <p className="font-medium text-sm">Booking tray</p>
            <p className="text-xs text-muted-foreground">
              {count === 0 ? "No bookings yet" : `${count} item${count !== 1 ? "s" : ""}`}
            </p>
          </div>
          {items.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={`${item.hotel_id}-${item.room_id}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm border-b last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.hotel_name ?? item.hotel_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.room_label ?? item.room_id} · ₹{item.price.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground h-7 px-1"
                    onClick={() => removeItem(item.hotel_id, item.room_id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="p-3">
            {count > 0 && (
              <p className="text-xs text-muted-foreground mb-2">
                Total: ₹{getCartTotal().toLocaleString()}
              </p>
            )}
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
              onClick={onProceedToCheckout}
              disabled={count === 0}
            >
              Proceed to checkout
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return content;
}
