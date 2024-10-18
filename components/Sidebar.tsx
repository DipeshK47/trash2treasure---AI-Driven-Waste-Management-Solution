import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { MapPin, Trash, Coins, Medal, Settings, Home } from "lucide-react";
import { useState, useEffect } from 'react';
import { getOrCreateReward } from "@/utils/db/actions";

// Define the sidebar items
const sidebarItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/report", icon: MapPin, label: "Report Waste" },
  { href: "/collect", icon: Trash, label: "Collect Waste" },
  { href: "/rewards", icon: Coins, label: "Rewards" },
  { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
];

interface SidebarProps {
  open: boolean; // Sidebar open state
  setOpen: (open: boolean) => void; // Function to close the sidebar
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();

  // Function to handle closing the sidebar on navigation
  const handleLinkClick = () => {
    setOpen(false); // Close the sidebar
  };

  return (
    <aside
      className={`bg-white border-r pt-20 border-gray-200 text-gray-800 w-56 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <nav className="h-full flex flex-col justify-between">
        <div className="px-4" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={`w-full justify-start py-3 mb-1.5 ${
                    pathname === item.href
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={handleLinkClick} // Close sidebar on click
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span className="text-base font-semibold">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-200" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          <Link href="/settings" passHref>
            <Button
              variant={pathname === "/settings" ? "secondary" : "outline"}
              className={`w-full py-3 ${
                pathname === "/settings"
                  ? "bg-green-100 text-green-800"
                  : "text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
              onClick={handleLinkClick} // Close sidebar on click
            >
              <Settings className="mr-3 h-5 w-5" />
              <span className="text-base font-semibold">Settings</span>
            </Button>
          </Link>
        </div>
      </nav>
    </aside>
  );
}

// UserDashboard Component for displaying rewards and notifications
export function UserDashboard({ userId }: { userId: number }) {
  const [reward, setReward] = useState<{ points: number; level: number } | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: string }>>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const userReward = await getOrCreateReward(userId);
      setReward(userReward);

      // Fetch notifications logic here, assume `getUserNotifications` exists
    };

    fetchUserData();
  }, [userId]);

  return (
    <div>
      <h2>User Dashboard</h2>
      {reward && (
        <div>
          <p>Points: {reward.points}</p>
          <p>Level: {reward.level}</p>
        </div>
      )}
    </div>
  );
}