'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Menu, Coins, Search, BellRing, User, ChevronDown, LogIn, LogOut } from 'lucide-react';
import { createUser, getUserByEmail, getUnreadNotifications, getUserBalance, markNotificationAsRead } from '@/utils/db/actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { useMediaQuery } from '@/hooks/userMediaQuery';

const clientId = process.env.WEB3_AUTH_CLIENT_ID;

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0xaa36a7',
  rpcTarget: 'https://rpc.ankr.com/eth_sepolia',
  displayName: 'Sepolia Testnet',
  blockExplorerUrl: 'https://sepolia.etherscan.io',
  ticker: 'ETH',
  tickerName: 'Ethereum',
  logo: 'https://assets.web3auth.io/evm-chains/sepolia.png',
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3Auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
  privateKeyProvider,
});

interface HeaderProps {
  onMenuClick: () => void;
  totalEarnings: number;
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [notification, setNotification] = useState<Notification[]>([]);
  const [balance, setBalance] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const init = async () => {
      try {
        await web3Auth.initModal();
        setProvider(web3Auth.provider);

        if (web3Auth.connected) {
          setLoggedIn(true);
          const user = await web3Auth.getUserInfo();
          setUserInfo(user);

          if (user.email) {
            localStorage.setItem('userEmail', user.email);
            try {
              await createUser(user.email, user.name || 'Anonymous user');
            } catch (error) {
              console.error('Error creating User:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing Web3Auth:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userInfo && userInfo.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) {
          const unreadNotifications = await getUnreadNotifications(user.id);
          setNotification(unreadNotifications);
        }
      }
    };

    fetchNotifications();

    const notificationInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(notificationInterval);
  }, [userInfo]);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (userInfo && userInfo.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) {
          const userBalance = await getUserBalance(user.id);
          setBalance(userBalance);
        }
      }
    };

    fetchUserBalance();

    const handleBalanceUpdate = (event: CustomEvent) => {
      setBalance(event.detail);
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate as EventListener);

    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate as EventListener);
    };
  }, [userInfo]);

  const login = async () => {
    if (!web3Auth) {
      console.error('Auth is not initialised');
      return;
    }
    try {
      const web3authProvider = await web3Auth.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);
      const user = await web3Auth.getUserInfo();
      setUserInfo(user);
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try {
          await createUser(user.email, user.name || 'Anonymous user');
        } catch (error) {
          console.error('Error creating user', error);
        }
      }
    } catch (error) {
      console.error('Error logging in', error);
    }
  };

  const logout = async () => {
    if (!web3Auth) {
      console.error('Web3Auth not initialised');
      return;
    }
    try {
      await web3Auth.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserInfo(null);
      setBalance(0); // Reset balance after logout
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    await markNotificationAsRead(notificationId);
  };

  if (loading) {
    return <div>Loading Web3 auth....</div>;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2" style={{ fontFamily: 'Times New Roman' }}>
        <div className="flex items-center">
          {/* The Menu button should only be visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:mr-4 lg:hidden" // hide on large screens (above 768px)
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6 text-gray-800" />
          </Button>
          <Link href="/" className="flex items-center">
            <img
              src="fa5e3326173425ec07a974877925419be3944db89098686f25028f029c8803f3.webp_copy-removebg.png"
              alt="Logo"
              className="h-6 w-6 md:h-8 md:w-8 mr-3 md:mr-4 transform scale-150"
              style={{ objectFit: 'contain' }}
            />
            <span className="font-bold text-xl md:text-2xl text-gray-800">trash2treasure</span>
          </Link>
        </div>
        {!isMobile && (
          <div className="flex-1 max-w-xl mx-4">
            <div
              className="relative"
              style={{
                background: '#006400',
                padding: '1.5px',
                borderRadius: '40px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'background 0.3s ease',
              }}
            >
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 bg-white border-none rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-custom"
                onFocus={(e) => {
                  e.target.parentNode.style.background = 'linear-gradient(90deg, #00FF7F, #00CC66, #009966)';
                }}
                onBlur={(e) => {
                  e.target.parentNode.style.background = '#006400';
                }}
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}
        <div className="flex items-center">
          {isMobile && (
            <Button variant="ghost" size="icon" className="mr-2">
              <Search className="h-5 w-5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 relative">
                <BellRing className="h-6 w-6 text-gray-500" />
                {notification.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                    {notification.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {notification.length > 0 ? (
                notification.map((notification: any) => (
                  <DropdownMenuItem key={notification.id} onClick={() => handleNotificationClick(notification.id)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{notification.type}</span>
                      <span className="text-sm text-gray-500">{notification.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>No New Notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
  
          {!loggedIn ? (
            <Button
              onClick={login}
              className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base rounded-lg px-4 py-2 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Login
              <LogIn className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
          ) : (
            <div className="mr-2 md:mr-2 flex items-center bg-gray-100 rounded-full px-4 py-1">
              <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
              <span className="font-semibold text-sm md:text-base text-gray-700">{balance.toFixed(2)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2 items-center flex">
                    <User className="h-5 w-5 mr-1 text-black" /> {/* Changed to text-black */}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>{userInfo ? userInfo.name : 'Profile'}</DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .placeholder-custom::placeholder {
          font-size: 18px;
        }
      `}</style>
    </header>
  );
}