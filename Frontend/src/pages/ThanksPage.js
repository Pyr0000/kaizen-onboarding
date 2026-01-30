import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

/**
 * A modern and responsive confirmation page component.
 * It uses a clean card layout and clear messaging.
 */
const ThanksPage = () => {
  // Define a clean, modern color palette for the success message
  // NOTE: This component relies heavily on Tailwind CSS classes for its styling.
  const primaryColor = 'indigo-600';
  const primaryBgColor = 'indigo-50';

  return (
    // Outer container: Ensures page takes full height and centers content
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8 font-inter">
      
      {/* The main card container for the thank you message */}
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-xl p-8 sm:p-12 text-center animate-fadeIn">
        
        {/* Success Icon Area */}
        <div className={`mx-auto w-16 h-16 mb-6 rounded-full bg-${primaryBgColor} flex items-center justify-center shadow-lg`}>
          <CheckCircle className={`w-8 h-8 text-${primaryColor}`} />
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
          Thank You!
        </h1>

        {/* Subtitle/Confirmation Message */}
        <p className="text-lg text-gray-600 mb-8">
          Your application has been successfully submitted and is now under review.
        </p>

        {/* Action / Follow-up Information Card */}
        <div className="border border-gray-200 bg-white rounded-lg p-5 text-left shadow-md transition duration-300 hover:shadow-lg">
          <div className="flex items-start space-x-4">
            {/* Clock icon to indicate a time-bound action */}
            <Clock className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Your Next Steps
              </h2>
              <p className="text-base text-gray-600">
                Our team will review your submission and contact you directly during our standard business hours: 
                <span className="font-medium text-gray-700"> Monday to Friday, 9:00 AM - 5:00 PM.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Subtle Footer branding/context */}
        <p className="text-sm text-gray-400 mt-10">
          We look forward to connecting with you soon.
        </p>
      </div>
      
      {/* Simple keyframe animation for a subtle entrance effect */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default ThanksPage;