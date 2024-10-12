'use client'

import { useState, useEffect } from "react"
import Link from 'next/link'
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import { Menu, Coins, Leaf, Search, Bell, User, ChevronDown, LogIn, LogOut } from 'lucide-react'
import { createUser, getUserByEmail, getUnreadNotifications, getUserBalance } from "@/utils/db/actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Badge } from "./ui/badge"
import { Web3Auth } from '@web3auth/modal'
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";  // Ensure this is correct or find 

const clientId = process.env.WEB3_AUTH_CLIENT_ID

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0xaa36a7',
    rpcTarget: 'https://rpc.ankr.com/eth_sepolia',
    displayName: 'Sepolia Testnet',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    logo: 'https://assets.web3auth.io/evm-chains/sepolia.png'
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: chainConfig
})

const web3Auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
    privateKeyProvider
})

interface HeaderProps {
    onMenuClick: () => void;
    totalEarnings: number;
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
    const [provider, setProvider] = useState<IProvider | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);
    const pathname = usePathname();
    const [notification, setNotification] = useState<Notification[]>([]);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const init = async () => {
            try {
                // Initialize Web3Auth modal
                await web3Auth.initModal();
                setProvider(web3Auth.provider);

                // Check if Web3Auth is connected
                if (web3Auth.connected) {
                    setLoggedIn(true);

                    // Get user information
                    const user = await web3Auth.getUserInfo(); // Make sure this is awaited
                    setUserInfo(user);

                    // Check if user email exists
                    if (user.email) {
                        // Store user email in localStorage
                        localStorage.setItem('userEmail', user.email);

                        try {
                            // Attempt to create the user
                            await createUser(user.email, user.name || 'Anonymous user');
                        } catch (error) {
                            console.error('Error creating User:', error); // Log error in user creation
                        }
                    }
                }
            } catch (error) {
                console.error('Error initializing Web3Auth:', error); // Log error in initialization
            } finally {
                setLoading(false); // Stop loading regardless of success or failure
            }
        };

        init(); // Call the init function

    }, []); // Empty dependency array means this effect runs once on mount

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

        fetchNotifications(); // Fetch notifications on mount

        const notificationInterval = setInterval(fetchNotifications, 30000); // Set up polling
        return () => clearInterval(notificationInterval); // Cleanup interval on unmount
    }, [userInfo]);

    useEffect(() => {
        const fetchUserBalance = async () => {
            if (userInfo && userInfo.email) {
                const user = await getUserByEmail(userInfo.email);
                if (user) {
                    const userBalance = await getUserBalance(user.id); // Added await
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
            console.error('Auth is not initialised')
            return
        }
        try {
            const web3authProvider = await web3Auth.connect()
            setProvider(web3authProvider)
            setLoggedIn(true)
            const user = await web3Auth.getUserInfo()
            setUserInfo(user)
            if(user.email){
                localStorage.setItem('userEmail', user.email)
                try {
                    await createUser(user.email, user.name || 'Ananomyous user')
                } catch (error) {
                    console.log('Error creting user', error)
                }
            }
        } catch (error) {
            console.error('Error loggin in', error)
        }
    }
}