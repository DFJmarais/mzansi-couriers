import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, Home, Truck, User, Settings } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Dashboard", icon: Truck, href: user?.role === "courier" ? "/courier/dashboard" : "/customer/dashboard" },
    { label: "Profile", icon: User, href: "/profile" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <>
      {/* Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50">
        <div className="flex justify-around items-center h-16 px-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors">
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Navigation Bar */}
      <nav className="hidden md:flex items-center justify-between bg-background border-b border-border px-6 py-4">
        <Link href="/" className="text-xl font-bold">Mzansi Couriers</Link>
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="hamburger"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)}>
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-background border-l border-border p-6 space-y-4 overflow-y-auto">
            <h2 className="text-lg font-bold mb-6">Menu</h2>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
