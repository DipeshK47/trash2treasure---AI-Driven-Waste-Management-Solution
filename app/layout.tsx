'use client';
import { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import CanvasLoader from '@/components/Loading'; // Import your CanvasLoader
import { getUserByEmail } from '@/utils/db/actions';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar state to control open/close
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true); // Loading state for Web3 initialization

  // Update to fetch user and total earnings once Web3 is ready
  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          const user = await getUserByEmail(userEmail);
          if (user) {
            const availableRewards = await getAvaliableRewards(user.id);
            setTotalEarnings(availableRewards);
          }
        }
      } catch (e) {
        console.log('Error fetching total earnings', e);
      } finally {
        // Stop loading after earnings are fetched
        console.log('Earnings fetched, setting loading to false.');
        setLoading(false);
      }
    };

    fetchTotalEarnings();
  }, []);

  useEffect(() => {
    console.log('Loading state:', loading); // Check the loading state when it changes
  }, [loading]);

  return (
    <html lang="en">
      <body className={inter.className}>
        {loading ? ( // If still loading, show the loading screen
          <CanvasLoader /> // This will cover the screen until loading is done
        ) : (
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header
              onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              totalEarnings={totalEarnings}
              setLoading={setLoading} // Pass setLoading function to the Header
            />
            <div className="flex flex-1">
              <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
              <main className="flex-1 p-0 lg:p-0 ml-0 lg:ml-[14rem] transition-all duration-300">
                {children}
              </main>
            </div>
          </div>
        )}
        <Toaster />
      </body>
    </html>
  );
}