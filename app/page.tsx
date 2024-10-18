<<<<<<< HEAD
'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Coins, Users, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'
=======
'use client';
import { useState, useEffect } from 'react';
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions';
>>>>>>> e2e2799a9fe2a1403f5b05302eb86cacc1226b0a

function AnimatedGlobe() {
  return (
    <div className="relative w-36 h-36 mx-auto mb-6">
      <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full bg-green-400 opacity-40 animate-ping"></div>
      <div className="absolute inset-4 rounded-full bg-green-300 opacity-60 animate-spin"></div>
      <div className="absolute inset-6 rounded-full bg-green-200 opacity-80 animate-bounce"></div>
      <img
        src="NEWa8ed58c411b49e588c7e780a4392fa0f04e183187a881092414e8108d36d0471.webp_copy-removebg-preview.png"
        alt="Logo"
        className="absolute inset-0 m-auto h-26 w-24 pr-2"
      />
    </div>
  );
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
<<<<<<< HEAD
=======
    tokensEarned: 0,
>>>>>>> e2e2799a9fe2a1403f5b05302eb86cacc1226b0a
    co2Offset: 0,
  });

  useEffect(() => {
    async function fetchImpactData() {
      try {
        const reports = await getRecentReports(100);
<<<<<<< HEAD
=======
        const rewards = await getAllRewards();
>>>>>>> e2e2799a9fe2a1403f5b05302eb86cacc1226b0a
        const tasks = await getWasteCollectionTasks(100);

        const wasteCollected = tasks.reduce((total, task) => {
          const match = task.amount.match(/(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[0]) : 0;
          return total + amount;
        }, 0);

        const reportsSubmitted = reports.length;
<<<<<<< HEAD
=======
        const tokensEarned = rewards.reduce((total, reward) => total + (reward.points || 0), 0);
>>>>>>> e2e2799a9fe2a1403f5b05302eb86cacc1226b0a
        const co2Offset = wasteCollected * 0.5;

        setImpactData({
          wasteCollected: Math.round(wasteCollected * 10) / 10,
          reportsSubmitted,
<<<<<<< HEAD
=======
          tokensEarned,
>>>>>>> e2e2799a9fe2a1403f5b05302eb86cacc1226b0a
          co2Offset: Math.round(co2Offset * 10) / 10,
        });
      } catch (error) {
        console.error('Error fetching impact data:', error);
        setImpactData({
          wasteCollected: 0,
          reportsSubmitted: 0,
<<<<<<< HEAD
=======
          tokensEarned: 0,
>>>>>>> e2e2799a9fe2a1403f5b05302eb86cacc1226b0a
          co2Offset: 0,
        });
      }
    }

    fetchImpactData();
  }, []);

  const login = () => setLoggedIn(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-white -mt-8">
      <style jsx>{`
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-2px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(2px);
          }
        }
        .shake-text {
          display: inline-block;
          animation: shake 2s infinite;
        }
      `}</style>

      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <section className="text-center mb-20">
          <AnimatedGlobe />
          <h1 className="text-5xl font-serif font-bold mb-6 text-gray-800 tracking-tight">
            Today Trash's, <span className="text-green-600">Tomorrow's Treasure</span>
          </h1>
          <p className="text-xl font-serif italic text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Join us in transforming <span className="font-bold text-gray-600 tracking-tight">Trash</span> into{' '}
            <span className="font-bold text-green-600">Treasure</span> and earn rewards while contributing to a greener future! 🌿
          </p>
          {!loggedIn ? (
            <Button
              onClick={login}
              className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <span className="shake-text">Get Started Today</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Link href="/report">
              <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
                <span className="shake-text">Report Waste Now</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </section>

        <section className="grid md:grid-cols-3 gap-10 mb-20 font-serif text-center">
          <FeatureCard
            icon={Leaf}
            title="Green & Clean ♻️"
            description="Help keep the planet clean by reporting and collecting waste."
          />
          <FeatureCard
            icon={Coins}
            title="Get Rewarded 🎁"
            description="Get rewarded with tokens for contributing to environmental conservation."
          />
          <FeatureCard
            icon={Users}
            title="Join the Movement 🌍"
            description="Become part of a community dedicated to sustainable solutions."
          />
        </section>

        <section className="bg-gradient-to-b from-green-100 to-white p-12 rounded-3xl shadow-xl mb-20 font-serif">
          <h2 className="text-5xl font-bold mb-12 text-center text-gray-800 tracking-wide">Our Green Journey 🌿✨</h2>
<<<<<<< HEAD
          <div className="flex justify-center">
            <div className="grid md:grid-cols-3 gap-12 max-w-7xl">
              <ImpactCard 
                title="Waste Collected 🗑️" 
                value={`${impactData.wasteCollected} kg`} 
                icon={Recycle} 
                className="bg-gradient-to-r from-white to-green-50 p-12 rounded-xl shadow-lg border border-transparent transition-transform duration-300 ease-in-out hover:scale-110 hover:shadow-2xl"
              />
              <ImpactCard 
                title="Reports Submitted ✅" 
                value={impactData.reportsSubmitted.toString()} 
                icon={MapPin} 
                className="bg-gradient-to-r from-white to-blue-50 p-12 rounded-xl shadow-lg border border-transparent transition-transform duration-300 ease-in-out hover:scale-110 hover:shadow-2xl"
              />
              <ImpactCard 
                title="CO2 Offset ♻️" 
                value={`${impactData.co2Offset} kg`} 
                icon={Leaf} 
                className="bg-gradient-to-r from-white to-green-50 p-12 rounded-xl shadow-lg border border-transparent transition-transform duration-300 ease-in-out hover:scale-110 hover:shadow-2xl"
              />
            </div>
=======
          <div className="grid md:grid-cols-4 gap-8">
            <ImpactCard 
              title="Waste Collected 🗑️" 
              value={`${impactData.wasteCollected} kg`} 
              icon={Recycle} 
              className="bg-gradient-to-r from-white to-green-50 p-8 rounded-xl shadow-lg border border-transparent transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl"
            />
            <ImpactCard 
              title="Reports Submitted ✅" 
              value={impactData.reportsSubmitted.toString()} 
              icon={MapPin} 
              className="bg-gradient-to-r from-white to-blue-50 p-8 rounded-xl shadow-lg border border-transparent transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl"
            />
            <ImpactCard 
              title="Tokens Earned 🎫" 
              value={impactData.tokensEarned.toString()} 
              icon={Coins} 
              className="bg-gradient-to-r from-white to-yellow-50 p-8 rounded-xl shadow-lg border border-transparent transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl"
            />
            <ImpactCard 
              title="CO2 Offset ♻️" 
              value={`${impactData.co2Offset} kg`} 
              icon={Leaf} 
              className="bg-gradient-to-r from-white to-green-50 p-8 rounded-xl shadow-lg border border-transparent transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl"
            />
>>>>>>> e2e2799a9fe2a1403f5b05302eb86cacc1226b0a
          </div>
        </section>
      </div>
    </div>
  );
}

function ImpactCard({ title, value, icon: Icon }) {
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;

  return (
<<<<<<< HEAD
    <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-md text-center">
      <Icon className="h-12 w-12 text-green-500 mb-4" />
      <p className="text-4xl font-bold mb-2 text-gray-800">{formattedValue}</p>
      <p className="text-xl text-gray-600">{title}</p>
=======
    <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-md">
      <Icon className="h-10 w-10 text-green-500 mb-4" />
      <p className="text-3xl font-bold mb-2 text-gray-800">{formattedValue}</p>
      <p className="text-sm text-gray-600">{title}</p>
>>>>>>> e2e2799a9fe2a1403f5b05302eb86cacc1226b0a
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col items-center text-center">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <Icon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h3>
      <p className="text-xl text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> e2e2799a9fe2a1403f5b05302eb86cacc1226b0a
