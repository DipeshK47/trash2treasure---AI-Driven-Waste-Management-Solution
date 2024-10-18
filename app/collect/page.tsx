'use client'
import { useState, useEffect } from 'react'
import { Trash2, MapPin, CheckCircle, Clock, ArrowRight, Camera, Upload, Loader, Calendar, Weight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { getWasteCollectionTasks, updateTaskStatus, saveReward, saveCollectedWaste, getUserByEmail } from '@/utils/db/actions'
import { GoogleGenerativeAI } from "@google/generative-ai"

// Make sure to set your Gemini API key in your environment variables
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

type CollectionTask = {
    id: number
    location: string
    wasteType: string
    amount: string
    status: 'pending' | 'in_progress' | 'completed' | 'verified'
    date: string
    collectorId: number | null
}

const ITEMS_PER_PAGE = 5

export default function CollectPage() {
    const [tasks, setTasks] = useState<CollectionTask[]>([])
    const [loading, setLoading] = useState(true)
    const [hoveredWasteType, setHoveredWasteType] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)

    useEffect(() => {
        const fetchUserAndTasks = async () => {
            setLoading(true)
            try {
                // Fetch user
                const userEmail = localStorage.getItem('userEmail')
                if (userEmail) {
                    const fetchedUser = await getUserByEmail(userEmail)
                    if (fetchedUser) {
                        setUser(fetchedUser)
                    } else {
                        toast.error('User not found. Please log in again.')
                        // Redirect to login page or handle this case appropriately
                    }
                } else {
                    toast.error('User not logged in. Please log in.')
                    // Redirect to login page or handle this case appropriately
                }

                // Fetch tasks
                const fetchedTasks = await getWasteCollectionTasks()
                setTasks(fetchedTasks as CollectionTask[])
            } catch (error) {
                console.error('Error fetching user and tasks:', error)
                toast.error('Failed to load user data and tasks. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        fetchUserAndTasks()
    }, [])

    const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null)
    const [verificationImage, setVerificationImage] = useState<string | null>(null)
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
    const [verificationResult, setVerificationResult] = useState<{
        wasteTypeMatch: boolean;
        quantityMatch: boolean;
        confidence: number;
    } | null>(null)
    const [reward, setReward] = useState<number | null>(null)

    const handleStatusChange = async (taskId: number, newStatus: CollectionTask['status']) => {
        if (!user) {
            toast.error('Please log in to collect waste.')
            return
        }

        try {
            const updatedTask = await updateTaskStatus(taskId, newStatus, user.id)
            if (updatedTask) {
                setTasks(tasks.map(task =>
                    task.id === taskId ? { ...task, status: newStatus, collectorId: user.id } : task
                ))
                toast.success('Task status updated successfully')
            } else {
                toast.error('Failed to update task status. Please try again.')
            }
        } catch (error) {
            console.error('Error updating task status:', error)
            toast.error('Failed to update task status. Please try again.')
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setVerificationImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const readFileAsBase64 = (dataUrl: string): string => {
        return dataUrl.split(',')[1]
    }

    const handleVerify = async () => {
        if (!selectedTask || !verificationImage || !user) {
            toast.error('Missing required information for verification.')
            return
        }
    
        setVerificationStatus('verifying')
    
        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey!)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
            const base64Data = readFileAsBase64(verificationImage)
    
            const imageParts = [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg', // Adjust this if you know the exact type
                    },
                },
            ]
    
            const prompt = `You are an expert in waste management and recycling. Analyze this image and provide:
            1. Confirm if the waste type matches: ${selectedTask.wasteType}
            2. Estimate if the quantity matches or if the area is clean and no waste is present.
            3. Your confidence level in this assessment (as a percentage)
    
            Respond in JSON format like this:
            {
              "wasteTypeMatch": true/false,
              "areaClean": true/false,
              "confidence": confidence level as a number between 0 and 1
            }`
    
            const result = await model.generateContent([prompt, ...imageParts])
            const response = await result.response
            const text = await response.text() // Ensure we await this
    
            // Remove any unnecessary escape characters from the response
            const sanitizedText = text.replace(/```json|```/g, '').trim()
    
            try {
                const parsedResult = JSON.parse(sanitizedText) // Parse the cleaned JSON
                setVerificationResult({
                    wasteTypeMatch: parsedResult.wasteTypeMatch,
                    areaClean: parsedResult.areaClean,
                    confidence: parsedResult.confidence
                })
                setVerificationStatus('success')
    
                if (parsedResult.areaClean && parsedResult.confidence > 0.5) {
                    await handleStatusChange(selectedTask.id, 'verified')
                    const earnedReward = Math.floor(Math.random() * 1000) + 10 // Random reward between 10 and 59
    
                    // Save the reward
                    await saveReward(user.id, earnedReward)
    
                    // Save the collected waste
                    await saveCollectedWaste(selectedTask.id, user.id, parsedResult)
    
                    setReward(earnedReward)
    
                    toast.success(`Verification successful! You earned ${earnedReward} tokens!`, {
                        duration: 5000,
                        position: 'top-center',
                    })
                } else {
                    toast.error('Verification failed. The area is not clean or confidence is too low.', {
                        duration: 5000,
                        position: 'top-center',
                    })
                }
            } catch (error) {
                console.error('Failed to parse JSON response:', sanitizedText)
                setVerificationStatus('failure')
                
            }
        } catch (error) {
            console.error('Error verifying waste:', error)
            setVerificationStatus('failure')
            toast.error('Error during verification process.', {
                duration: 5000,
                position: 'top-center',
            })
        } finally {
            // Reset modal state and close the modal in both success and failure cases
            setSelectedTask(null)  // This will close the modal
            setVerificationImage(null)  // Reset the uploaded image
            setVerificationStatus('idle')  // Reset the verification status
        }
    }
    

    const filteredTasks = tasks.filter(task =>
        task.location.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 to-white px-4 py-4">
            <div className="max-w-screen-lg mx-auto">
                <h1 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-800 font-serif">
                    Clean-Up Quests 🧹
                </h1>

                <div className="mb-4 flex items-center">
                    <Input
                        type="text"
                        placeholder="Explore areas near you..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl italic focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 mr-2"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="bg-white border border-green-600 text-green-600 hover:bg-green-100"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="animate-spin h-8 w-8 text-gray-500" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {paginatedTasks.map(task => (
                                <div key={task.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                            <MapPin className="w-5 h-5 mr-2 text-green-500" />
                                            {task.location}
                                        </h2>
                                        <StatusBadge status={task.status} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center relative">
                                            <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                                            <span
                                                onMouseEnter={() => setHoveredWasteType(task.wasteType)}
                                                onMouseLeave={() => setHoveredWasteType(null)}
                                                className="cursor-pointer"
                                            >
                                                {task.wasteType.length > 8 ? `${task.wasteType.slice(0, 8)}...` : task.wasteType}
                                            </span>
                                            {hoveredWasteType === task.wasteType && (
                                                <div className="absolute left-0 top-full mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                                                    {task.wasteType}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center">
                                            <Weight className="w-4 h-4 mr-2 text-gray-500" />
                                            {task.amount}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                                            {task.date}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        {task.status === 'pending' && (
                                            <Button
                                                onClick={() => handleStatusChange(task.id, 'in_progress')}
                                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl transition-colors duration-300"
                                            >
                                                Start Collection
                                            </Button>
                                        )}
                                        {task.status === 'in_progress' && task.collectorId === user?.id && (
                                            <Button
                                                onClick={() => setSelectedTask(task)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl transition-colors duration-300"
                                            >
                                                Submit and Verify ✔️
                                            </Button>
                                        )}
                                        {task.status === 'in_progress' && task.collectorId !== user?.id && (
                                            <span className="text-yellow-600 text-sm font-medium">In progress by another collector</span>
                                        )}
                                        {task.status === 'verified' && (
                                            <span className="text-green-600 text-sm font-medium">Reward Earned</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-center items-center space-x-4">
                            <Button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="bg-white border border-green-600 text-green-600 hover:bg-green-100 py-2 px-4 rounded-xl transition-colors duration-300"
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-700">
                                Page {currentPage} of {pageCount}
                            </span>
                            <Button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                                disabled={currentPage === pageCount}
                                className="bg-white border border-green-600 text-green-600 hover:bg-green-100 py-2 px-4 rounded-xl transition-colors duration-300"
                            >
                                Next
                            </Button>
                        </div>
                    </>
                )}

                {selectedTask && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <h3 className="text-2xl font-bold mb-4 text-gray-800">Confirm Waste Collection ✅</h3>
                            <p className="mb-4 text-sm text-gray-600">📸 Provide a photo of the collected waste to complete verification and receive your reward 🎉</p>
                            
                            <div className="mb-4">
                                <label htmlFor="verification-image" className="block text-xl text-gray-700 mb-2 font-bold">
                                    Upload Image ⬆️
                                </label>
                                <div className="mt-1 flex justify-center px-4 py-6 border-2 border-green-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex flex-col sm:flex-row justify-center text-sm text-gray-600">
                                            <label
                                                htmlFor="verification-image"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                                            >
                                                <span>Click to upload a cleanup photo 📸</span>
                                                <input id="verification-image" name="verification-image" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                                            </label>
                                            <span className="sm:ml-2 mt-1 sm:mt-0">or drag and drop</span>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                </div>
                            </div>
                            
                            {verificationImage && (
                                <img src={verificationImage} alt="Verification" className="mb-4 rounded-md w-full shadow-md" />
                            )}
                            
                            <Button
                                onClick={handleVerify}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-bold rounded-xl transition-colors duration-300 flex items-center justify-center"
                                disabled={!verificationImage || verificationStatus === 'verifying'}
                            >
                                {verificationStatus === 'verifying' ? (
                                    <>
                                        <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 " />
                                        Verifying...
                                    </>
                                ) : 'Verify Collection ✅'}
                            </Button>
                            
                            {verificationStatus === 'success' && verificationResult && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md shadow-inner">
                                    <p>Waste Type Match: {verificationResult.wasteTypeMatch ? 'Yes' : 'No'}</p>
                                    <p>Quantity Match: {verificationResult.quantityMatch ? 'Yes' : 'No'}</p>
                                    <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                                </div>
                            )}
                            
                            {verificationStatus === 'failure' && (
                                <p className="mt-2 text-red-600 text-center text-sm">Verification failed. Please try again.</p>
                            )}
                            
                            <Button onClick={() => setSelectedTask(null)} variant="outline" className="w-full mt-2 bg-white border border-red-600 text-red-600 hover:bg-red-50">
                                Close ❌
                            </Button>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end">
                    {user ? (
                        <p className="text-sm text-gray-600 mb-4 pt-4 italic text-right font-serif">
                            Logged in as: {user.name}
                        </p>
                    ) : (
                        <p className="text-sm text-red-600 mb-4 italic text-right font-serif">
                            Please log in to collect waste and earn rewards.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: CollectionTask['status'] }) {
    const statusConfig = {
        pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        in_progress: { color: 'bg-blue-100 text-blue-800', icon: () => <span>⏳</span> },
        completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
        verified: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
    }

    const { color, icon: Icon } = statusConfig[status]

    // Capitalize the first letter of the status text
    const capitalizedStatus = status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${color} flex items-center`}>
            <Icon className="mr-1 h-3 w-3" />
            {capitalizedStatus}
        </span>
    )
}
