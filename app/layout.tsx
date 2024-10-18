'use client';

import { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header'; // Import your custom Header
import Sidebar from '@/components/Sidebar'; // Import your custom Sidebar
import { getAvaliableRewards, getUserByEmail } from '@/utils/db/actions';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children } : Readonly<{
  children: React.ReactNode
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar state to control open/close
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(()=>{
    const fetchTotalEarnings = async()=>{
      try {
        const userEmail = localStorage.getItem('userEmail')
        if(userEmail) {
          const user = await getUserByEmail(userEmail);
          if(user){
            const availableRewards = await getAvaliableRewards(user.id) as any; 
            setTotalEarnings(availableRewards)
          }
        }
      } catch (e) {
        console.log('Error fetching total earnings', e)
      }
    };
    fetchTotalEarnings();
  },[])

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
            totalEarnings={0}
            showMenuButton={true} // Pass a prop to control button visibility
          />
          <div className="flex flex-1">
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
            <main className="flex-1 p-0 lg:p-0 ml-0 lg:ml-[14rem] transition-all duration-300">
  {children}
</main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}