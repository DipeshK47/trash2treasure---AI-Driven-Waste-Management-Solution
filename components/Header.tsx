'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Menu, Coins, Search, BellRing, User, ChevronDown, LogIn, X } from 'lucide-react';
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
};

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const init = async () => {
      try {
        if (!clientId) {
          throw new Error('WEB3_AUTH_CLIENT_ID is not set in environment variables');
        }

        const web3AuthInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
          chainConfig,
          privateKeyProvider,
        });

        setWeb3Auth(web3AuthInstance);
        await web3AuthInstance.initModal();

        if (web3AuthInstance.connected) {
          setLoggedIn(true);
          const user = await web3AuthInstance.getUserInfo();
          setUserInfo(user);
          setProvider(web3AuthInstance.provider);

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
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userInfo?.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) {
          const unreadNotifications = await getUnreadNotifications(user.id);
          setNotifications(unreadNotifications);
        }
      }
    };

    fetchNotifications();
    const notificationInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(notificationInterval);
  }, [userInfo]);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (userInfo?.email) {
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
      setError(error.message);
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
      setBalance(0);
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Error logging out', error);
      setError(error.message);
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    await markNotificationAsRead(notificationId);
  };

  if (loading) {
    return <div>Loading Web3 auth....</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <header className="bg-white bg-opacity-50 backdrop-blur-lg border-b border-emerald-200 sticky top-0 z-50">
      <div className="relative">
        {isSearchOpen && <div className="fixed inset-0 bg-emerald-200 opacity-50 blur-lg z-10"></div>}
        <div className={`flex items-center justify-between px-4 py-2 relative z-20 transition-all duration-300`}>
          {!isSearchOpen && (
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 md:mr-4 lg:hidden"
                onClick={onMenuClick}
              >
                <Menu className="h-6 w-6 text-emerald-600" />
              </Button>
              <Link href="/" className="flex items-center">
                <img
                  src="NEWa8ed58c411b49e588c7e780a4392fa0f04e183187a881092414e8108d36d0471.webp_copy-removebg-preview.png"
                  alt="Logo"
                  className="h-6 w-6 md:h-8 md:w-8 mr-3 md:mr-4 transform scale-150"
                  style={{ objectFit: 'contain' }}
                />
                {!isMobile && <span className="font-bold text-xl md:text-3xl text-emerald-600" style={{ fontFamily: 'Times New Roman' }}>trash2treasure</span>}
              </Link>
            </div>
          )}

          {!isSearchOpen && !isMobile && (
            <div className="flex-1 max-w-xl mx-4">
              <SearchBar />
            </div>
          )}

          {!isSearchOpen && (
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5 text-emerald-600" />
              </Button>

              <NotificationMenu notifications={notifications} onNotificationClick={handleNotificationClick} />

              {loggedIn ? (
                <UserMenu userInfo={userInfo} balance={balance} onLogout={logout} />
              ) : (
                <LoginButton onLogin={login} />
              )}
            </div>
          )}

          {isSearchOpen && (
            <div className="absolute inset-0 bg-white z-50 flex items-center px-4 animate-slide-up" style={{ top: '2rem' }}>
              <SearchBar />
              <Button variant="ghost" size="icon" className="ml-2" onClick={() => setIsSearchOpen(false)}>
                <X className="h-6 w-6 text-emerald-600" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchBar() {
  return (
    <div
      className="relative w-full"
      style={{
        background: '#50C878',
        padding: '1.5px',
        borderRadius: '40px',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <input
        type="text"
        placeholder="Search..."
        className="w-full px-4 py-2 bg-white border-none rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-lg"
        onFocus={(e) => {
          e.target.parentNode.style.background = 'linear-gradient(90deg, #00FF7F, #00CC66, #009966)';
        }}
        onBlur={(e) => {
          e.target.parentNode.style.background = '#006400';
        }}
      />
      <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
    </div>
  );
}

function NotificationMenu({ notifications, onNotificationClick }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellRing className="h-6 w-6 text-emerald-600" />
          {notifications.length > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5 bg-emerald-100 text-emerald-700">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white bg-opacity-75 backdrop-blur-sm border-emerald-200">
        {notifications.length > 0 ? (
          notifications.map((notification: any) => (
            <DropdownMenuItem key={notification.id} onClick={() => onNotificationClick(notification.id)}>
              <div className="flex flex-col">
                <span className="font-medium text-emerald-700">{notification.type}</span>
                <span className="text-sm text-emerald-500">{notification.message}</span>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem>No New Notifications</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ userInfo, balance, onLogout }) {
  return (
    <div className="flex items-center bg-gray-100 rounded-full px-4 py-1">
      <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-emerald-500" />
      <span className="font-semibold text-sm md:text-base text-gray-700">{balance.toFixed(2)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-2 items-center flex">
            <User className="h-5 w-5 mr-1 text-black" />
            <ChevronDown className="h-4 w-4 text-emerald-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white bg-opacity-75 backdrop-blur-sm border-emerald-200">
          <DropdownMenuItem>{userInfo ? userInfo.name : 'Profile'}</DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout}>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function LoginButton({ onLogin }) {
  return (
    <Button
      onClick={onLogin}
      className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm md:text-base rounded-lg px-4 py-2 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
    >
      Login
      <LogIn className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5" />
    </Button>
  );
}