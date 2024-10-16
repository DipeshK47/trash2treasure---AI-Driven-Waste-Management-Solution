'use client';
import { useState, useCallback, useEffect } from 'react';
import { MapPin, Upload, CheckCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import { Libraries } from '@react-google-maps/api';
import { createUser, getUserByEmail, createReport, getRecentReports } from '@/utils/db/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const libraries: Libraries = ['places'];

export default function ReportPage() {
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
  const router = useRouter();

  const [reports, setReports] = useState<Array<{
    id: number;
    location: string;
    wasteType: string;
    amount: string;
    createdAt: string;
  }>>([]);

  const [newReport, setNewReport] = useState({
    location: '',
    type: '',
    amount: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle');
  const [verificationResult, setVerificationResult] = useState<{
    wasteType: string;
    quantity: string;
    confidence: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey!,
    libraries: libraries
  });

  const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  }, []);

  const onPlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        setNewReport(prev => ({
          ...prev,
          location: place.formatted_address || '',
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewReport({ ...newReport, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    if (!file) return;

    setVerificationStatus('verifying');

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64Data = await readFileAsBase64(file);

      const imageParts = [
        {
          inlineData: {
            data: base64Data.split(',')[1],
            mimeType: file.type,
          },
        },
      ];

      const prompt = `You are an expert in waste management and recycling. Analyze this image and provide:
        1. The type of waste (e.g., plastic, paper, glass, metal, organic)
        2. An estimate of the quantity or amount (in kg or liters)
        3. Your confidence level in this assessment (as a percentage)

        Respond **only** in pure JSON format without any additional text or markdown, like this:
        {
          "wasteType": "type of waste",
          "quantity": "estimated quantity with unit",
          "confidence": confidence level as a number between 0 and 1
        }`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      let text = response.text();

      // Sanitize the response by removing Markdown code blocks if present
      text = text.trim();

      // Remove code block syntax if present
      if (text.startsWith("```") && text.endsWith("```")) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }

      // Remove any surrounding quotes
      if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
        text = text.slice(1, -1);
      }

      try {
        const parsedResult = JSON.parse(text);

        // Handling specific invalid wasteType or zero confidence
        if (
          parsedResult.wasteType === "None, this is an image of a logo" ||
          parsedResult.confidence === 0 ||
          !parsedResult.wasteType ||
          !parsedResult.quantity
        ) {
          console.error('Invalid verification result:', parsedResult);
          setVerificationStatus('failure');
          setVerificationResult(parsedResult); // Still set the result to show error details
          toast.error('Verification failed. Please ensure the image clearly shows the waste.');
        } else {
          setVerificationResult(parsedResult);
          setVerificationStatus('success');
          setNewReport({
            ...newReport,
            type: parsedResult.wasteType,
            amount: parsedResult.quantity,
          });
          toast.success('Waste verified successfully!');
        }
      } catch (error) {
        console.error('Failed to parse JSON response:', text);
        setVerificationStatus('failure');
        toast.error('Failed to parse verification results. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying waste:', error);
      setVerificationStatus('failure');
      toast.error('An error occurred during verification. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== 'success' || !user) {
      toast.error('Please verify the waste before submitting or log in.');
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await createReport(
        user.id,
        newReport.location,
        newReport.type,
        newReport.amount,
        preview || undefined,
        verificationResult ? JSON.stringify(verificationResult) : undefined
      ) as any;

      const formattedReport = {
        id: report.id,
        location: report.location,
        wasteType: report.wasteType,
        amount: report.amount,
        createdAt: report.createdAt.toISOString().split('T')[0]
      };

      setReports([formattedReport, ...reports]);
      setNewReport({ location: '', type: '', amount: '' });
      setFile(null);
      setPreview(null);
      setVerificationStatus('idle');
      setVerificationResult(null);

      toast.success(`Report submitted successfully! You've earned points for reporting waste.`);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const email = localStorage.getItem('userEmail');
      if (email) {
        let user = await getUserByEmail(email);
        if (!user) {
          user = await createUser(email, 'Anonymous User');
        }
        setUser(user);

        try {
          const recentReports = await getRecentReports();
          const formattedReports = (recentReports || []).map(report => ({
            ...report,
            createdAt: report.createdAt.toISOString().split('T')[0]
          }));
          setReports(formattedReports);
        } catch (error) {
          console.error('Error fetching recent reports:', error);
          setReports([]);  // Ensure that `reports` is at least an empty array
        }
      } else {
        router.push('/login');
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-white px-4 py-4">
      <div className="max-w-screen-lg mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-800 text-center font-serif">
          Snap & Scrap: Report Waste in a Flash♻️🗑️🚛
        </h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mb-12">
          <div className="mb-6">
            <label htmlFor="waste-image" className="block text-xl text-gray-700 mb-2 font-bold" style={{ fontFamily: 'Times New Roman' }}>
              Show Us the Waste 👀
            </label>
            <div className="mt-1 flex justify-center px-4 py-6 border-2 border-green-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex flex-col sm:flex-row justify-center text-sm text-gray-600">
                  <label
                    htmlFor="waste-image"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                  >
                    <span>Click to upload a waste photo 📸</span>
                    <input id="waste-image" name="waste-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                  </label>
                  <span className="sm:ml-2 mt-1 sm:mt-0">or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          {preview && (
            <div className="mt-4 mb-6">
              <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-xl shadow-md" />
            </div>
          )}

          <Button
            type="button"
            onClick={handleVerify}
            className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-bold rounded-xl transition-colors duration-300 flex items-center justify-center"
            style={{ fontFamily: 'Times New Roman' }}
            disabled={!file || verificationStatus === 'verifying'}
          >
            {verificationStatus === 'verifying' ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Verifying...
              </>
            ) : 'Verify Trash Info 🗑️'}
          </Button>

          {verificationResult && (
            <div
              className={`p-4 mb-6 rounded-r-xl ${verificationStatus === 'failure' || verificationResult.wasteType === "None, this is an image of a logo" || verificationResult.confidence === 0
                  ? 'bg-red-50 border-l-4 border-red-400'
                  : 'bg-green-50 border-l-4 border-green-400'
                }`}
            >
              <div className="flex items-center">
                {(verificationStatus === 'failure' || verificationResult.wasteType === "None, this is an image of a logo" || verificationResult.confidence === 0) ? (
                  <CheckCircle className="h-6 w-6 text-red-400 mr-3" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                )}
                <div>
                  <h3
                    className={`text-lg font-medium ${verificationStatus === 'failure' || verificationResult.wasteType === "None, this is an image of a logo" || verificationResult.confidence === 0
                        ? 'text-red-800'
                        : 'text-green-800'
                      }`}
                  >
                    {(verificationStatus === 'failure' || verificationResult.wasteType === "None, this is an image of a logo" || verificationResult.confidence === 0)
                      ? 'Verification Failed'
                      : 'Verification Successful'}
                  </h3>
                  <div
                    className={`mt-2 text-sm ${verificationStatus === 'failure' || verificationResult.wasteType === "None, this is an image of a logo" || verificationResult.confidence === 0
                        ? 'text-red-700'
                        : 'text-green-700'
                      }`}
                  >
                    <p>Waste Type: {verificationResult.wasteType}</p>
                    <p>Quantity: {verificationResult.quantity}</p>
                    <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="location" className="block text-m font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Times New Roman' }}>Where’s the Waste?📍</label>
              {isLoaded ? (
                <StandaloneSearchBox
                  onLoad={onLoad}
                  onPlacesChanged={onPlacesChanged}
                >
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={newReport.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl italic focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                    placeholder="Where’s the Waste Located?"
                  />
                </StandaloneSearchBox>
              ) : (
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newReport.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl italic focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                  placeholder="Where’s the Waste Located?"
                />
              )}
            </div>
            <div>
              <label htmlFor="type" className="block text-m font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Times New Roman' }}>Waste Category ♻️</label>
              <input
                type="text"
                id="type"
                name="type"
                value={newReport.type}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 italic rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
                placeholder="Verified Waste Category"
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="amount" className="block text-m font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Times New Roman' }}>Estimated Quantity of Waste ⚖️</label>
              <input
                type="text"
                id="amount"
                name="amount"
                value={newReport.amount}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl italic focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
                placeholder="Estimated Trash Load"
                readOnly
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg rounded-xl font-extrabold transition-colors duration-300 flex items-center justify-center"
            style={{ fontFamily: 'Times New Roman' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Submitting...
              </>
            ) : 'Submit Waste Report 🗳️'}
          </Button>
        </form>

        <h2 className="text-3xl font-semibold mb-6 text-gray-800" style={{ fontFamily: 'Times New Roman' }}>Recent Submissions 📁</h2>

        {/* Responsive Table Container */}
        <div className="bg-white rounded-2xl shadow-lg">
          {/* Ensure overflow-x-auto is properly applied without conflicting overflow-hidden */}
          <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 py-4 whitespace-normal text-sm text-gray-500">
                      <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
                      {report.location}
                    </td>
                    <td className="px-4 py-4 whitespace-normal text-sm text-gray-500">{report.wasteType}</td>
                    <td className="px-4 py-4 whitespace-normal text-sm text-gray-500">{report.amount}</td>
                    <td className="px-4 py-4 whitespace-normal text-sm text-gray-500">{report.createdAt}</td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      No reports submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}