'use client'
import { useState, useEffect } from 'react'
import { getAllRewards, getUserByEmail } from '@/utils/db/actions'
import { Loader, Award, User, Trophy, Crown } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Reward = {
  id: number
  userId: number
  points: number
  createdAt: Date
  userName: string | null
}

export default function LeaderboardPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)

  useEffect(() => {
    const fetchRewardsAndUser = async () => {
      setLoading(true);
      try {
        // Fetch rewards
        const fetchedRewards = await getAllRewards();
        console.log("Fetched Rewards: ", fetchedRewards); // Check if rewards are fetched
        setRewards(fetchedRewards);
  
        // Fetch user data
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail);
          console.log("Fetched User: ", fetchedUser); // Check if user is fetched
          if (fetchedUser) {
            setUser(fetchedUser);
          } else {
            toast.error('User not found. Please log in again.');
          }
        } else {
          toast.error('User not logged in. Please log in.');
        }
      } catch (error) {
        console.error('Error fetching rewards and user:', error);
        toast.error('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchRewardsAndUser();
  }, []);

  // Debugging rewards state to ensure it contains data
  useEffect(() => {
    console.log("Rewards state: ", rewards) // Log rewards state to inspect it
  }, [rewards])

  // Placeholder for handling userName null
  const getUserName = (userName: string | null) => userName || 'Anonymous User'

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold mb-3 text-gray-800 font-serif">Leaderboard 🔥</h1>
        <p className="text-sm font-serif italic text-gray-600 mb-5">Keep track of the highest achievers and their successes.</p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-8 w-8 text-gray-600" />
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <div className="flex justify-between items-center text-white font-serif">
                <Trophy className="h-10 w-10" />
                <span className="text-2xl font-serif font-bold">Leading Contributors</span>
                <Award className="h-10 w-10" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 font-serif">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                  </tr>
                </thead>
                <tbody className="font-serif">
                  {rewards.map((reward, index) => (
                    <tr key={reward.id} className={`${user && user.id === reward.userId ? 'bg-indigo-50' : ''} hover:bg-gray-50 transition-colors duration-150 ease-in-out`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <Crown className={`h-6 w-6 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : 'text-yellow-600'}`} />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <User className="h-full w-full rounded-full bg-gray-200 text-gray-500 p-2" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{getUserName(reward.userName)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Award className="h-5 w-5 text-indigo-500 mr-2" />
                          <div className="text-sm font-semibold text-gray-900">{reward.points.toLocaleString()}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}