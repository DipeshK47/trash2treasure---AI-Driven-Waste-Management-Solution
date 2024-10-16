// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import ContractInteraction from '@/components/ContractInteraction'
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'

const poppins = Poppins({
  weight: ['300', '400', '600'],
  subsets: ['latin'],
  display: 'swap',
})

function AnimatedGlobe() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8">
      <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full bg-green-400 opacity-40 animate-ping"></div>
      <div className="absolute inset-4 rounded-full bg-green-300 opacity-60 animate-spin"></div>
      <div className="absolute inset-6 rounded-full bg-green-200 opacity-80 animate-bounce"></div>
      <Leaf className="absolute inset-0 m-auto h-16 w-16 text-green-600 animate-pulse" />
    </div>
  )
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0,
  });

  useEffect(() => {
    async function fetchImpactData() {
      try {
        const reports = await getRecentReports(100);
        const rewards = await getAllRewards();
        const tasks = await getWasteCollectionTasks(100);

        const wasteCollected = tasks.reduce((total, task) => {
          const match = task.amount.match(/(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[0]) : 0;
          return total + amount;
        }, 0);

        const reportsSubmitted = reports.length;
        const tokensEarned = rewards.reduce((total, reward) => total + (reward.points || 0), 0);
        const co2Offset = wasteCollected * 0.5;

        setImpactData({
          wasteCollected: Math.round(wasteCollected * 10) / 10,
          reportsSubmitted,
          tokensEarned,
          co2Offset: Math.round(co2Offset * 10) / 10,
        });
      } catch (error) {
        console.error('Error fetching impact data:', error);
        setImpactData({
          wasteCollected: 0,
          reportsSubmitted: 0,
          tokensEarned: 0,
          co2Offset: 0,
        });
      }
    }

    fetchImpactData();
  }, []);

  const login = () => setLoggedIn(true);

  return (
    <div
      className={`container mx-auto px-4 py-16 ${poppins.className}`}
      // style={{ fontFamily: "'Times New Roman', Times, serif" }}
      style={{ fontFamily: "'Arial', sans-serif" }} // Inline font styling
      // style={{ fontFamily: "'Helvetica', sans-serif" }}
      // style={{ fontFamily: "'Pacifico', cursive" }}
      // style={{ fontFamily: "'Dancing Script', cursive" }}
      // style={{ fontFamily: "'Protest Strike', cursive" }}
      // style={{ fontFamily: "'Lobster', cursive" }}
      // style={{ fontFamily: "'Courier New', monospace" }}
      // style={{ fontFamily: "'Consolas', monospace" }}
      // style={{ fontFamily: "'Indie Flower', cursive" }}
      // style={{ fontFamily: "'Patrick Hand', cursive" }}
      // style={{ fontFamily: "'Old English Text MT', serif" }}
      // style={{ fontFamily: "'Didot', serif" }}
      // style={{ fontFamily: "'Bodoni', serif" }}


    > 
      <section className="text-center mb-20">
        <AnimatedGlobe />
        <h1 className="text-7xl font-bold mb-6 text-gray-800 tracking-tight"> {/* Increased font size */}
          Trash Today, <span className="text-green-600">Treasure Tomorrow</span>
        </h1>
        <p className="text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8"> {/* Increased font size */}
          Join us to turn <span className="font-bold text-gray-600 tracking-tight">Trash</span> into{' '}
          <span className="font-bold text-green-600">Treasure</span> and earn rewards for a greener tomorrow🌿!
        </p>
        {!loggedIn ? (
          <Button
            onClick={login}
            className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Link href="/report">
            <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
              Report Waste
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-10 mb-20">
        <FeatureCard
          icon={Leaf}
          title="Eco-Friendly ♻️"
          description="Contribute to a cleaner environment by reporting and collecting waste."
        />
        <FeatureCard
          icon={Coins}
          title="Earn Rewards 🎁"
          description="Get tokens for your contributions to waste management efforts."
        />
        <FeatureCard
          icon={Users}
          title="Community-Driven 👨‍👨"
          description="Be part of a growing community committed to sustainable practices."
        />
      </section>

      <section className="bg-white p-12 rounded-3xl shadow-lg mb-20">
        <h2 className="text-5xl font-bold mb-12 text-center text-gray-800">Our Impact</h2> {/* Increased font size */}
        <div className="grid md:grid-cols-4 gap-6">
          <ImpactCard title="Waste Collected 🗑️" value={`${impactData.wasteCollected} kg`} icon={Recycle} />
          <ImpactCard title="Reports Submitted ✅" value={impactData.reportsSubmitted.toString()} icon={MapPin} />
          <ImpactCard title="Tokens Earned 🎫" value={impactData.tokensEarned.toString()} icon={Coins} />
          <ImpactCard title="CO2 Offset ♻️" value={`${impactData.co2Offset} kg`} icon={Leaf} />
        </div>
      </section>
    </div>
  );
}

function ImpactCard({ title, value, icon: Icon }) {
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;

  return (
    <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-md">
      <Icon className="h-10 w-10 text-green-500 mb-4" />
      <p className="text-3xl font-bold mb-2 text-gray-800">{formattedValue}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col items-center text-center">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <Icon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h3> {/* Increased font size */}
      <p className="text-xl text-gray-600 leading-relaxed">{description}</p> {/* Increased font size */}
    </div>
  );
}
