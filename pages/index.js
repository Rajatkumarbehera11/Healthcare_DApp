import React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import CustomConnectButton from "../components/layout/CustomConnectButton";

const IndexPage = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col text-gray-300">
      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative py-20 sm:py-24 lg:py-32 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent mb-6">
                Secure Healthcare on the
                <span className="block text-white">Blockchain</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Experience the future of healthcare with our decentralized platform.
                Secure, transparent, and patient-centric medical record management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={isConnected ? "/dashboard" : "/patient/register"} legacyBehavior>
                  <a className="btn-teal text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                    Get Started as Patient
                  </a>
                </Link>
                <Link href={isConnected ? "/dashboard" : "/doctor/register"} legacyBehavior>
                  <a className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors border-2 border-gray-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                    Join as Doctor
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Why Choose HealthChain?</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Our blockchain-based healthcare platform offers unparalleled security and transparency
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.7)] cursor-pointer transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(139,92,246,1)] transform hover:-translate-y-1 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-tr from-purple-700 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
                <p className="text-gray-300">Your medical data is encrypted and stored securely on the blockchain</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.7)] cursor-pointer transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(34,197,94,1)] transform hover:-translate-y-1 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-tr from-green-600 to-green-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Transparent</h3>
                <p className="text-gray-300">All transactions are recorded on the blockchain for complete transparency</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.7)] cursor-pointer transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(139,92,246,1)] transform hover:-translate-y-1 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-tr from-purple-700 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Fast & Efficient</h3>
                <p className="text-gray-300">Quick access to your medical records and appointment scheduling</p>
              </div>
            </div>
          </div>
        </section>

        {/* Role Selection Section */}
        <section className="py-16 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Choose Your Role</h2>
              <p className="text-lg text-gray-300">Join our healthcare ecosystem as a patient, doctor, or administrator</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.7)] p-8 cursor-pointer transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(139,92,246,1)] transform hover:-translate-y-1 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-tr from-purple-700 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Patient</h3>
                <p className="text-gray-300 mb-6">
                  Manage the healthcare platform as an administrator. Oversee doctors, monitor appointments, and ensure platform integrity.
                </p>
                <ul className="text-sm text-gray-300 mb-6 space-y-2">
                  <li>• Manage doctor registrations</li>
                  <li>• Monitor platform activity</li>
                  <li>• View analytics and reports</li>
                  <li>• Platform administration</li>
                </ul>
                <Link
                  href={isConnected ? "/patient/dashboard" : "/patient/register"}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 text-white hover:text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 inline-block text-center"
                >
                  {isConnected ? "Go to Dashboard" : "Register as Patient"}
                </Link>
              </div>

              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.7)] p-8 cursor-pointer transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(34,197,94,1)] transform hover:-translate-y-1 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-tr from-green-600 to-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Doctor</h3>
                <p className="text-gray-300 mb-6">
                  Manage the healthcare platform as an administrator. Oversee doctors, monitor appointments, and ensure platform integrity.
                </p>
                <ul className="text-sm text-gray-300 mb-6 space-y-2">
                  <li>• Manage doctor registrations</li>
                  <li>• Monitor platform activity</li>
                  <li>• View analytics and reports</li>
                  <li>• Platform administration</li>
                </ul>
                <Link
                  href={isConnected ? "/doctor/dashboard" : "/doctor/register"}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white hover:text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 inline-block text-center"
                >
                  {isConnected ? "Go to Dashboard" : "Register as Doctor"}
                </Link>
              </div>

              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.7)] p-8 cursor-pointer transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(220,38,38,1)] transform hover:-translate-y-1 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-tr from-red-700 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Administrator</h3>
                <p className="text-gray-300 mb-6">
                  Manage the healthcare platform as an administrator. Oversee doctors,
                  monitor appointments, and ensure platform integrity.
                </p>
                <ul className="text-sm text-gray-300 mb-6 space-y-2">
                  <li>• Manage doctor registrations</li>
                  <li>• Monitor platform activity</li>
                  <li>• View analytics and reports</li>
                  <li>• Platform administration</li>
                </ul>
                <Link
                  href="/admin/dashboard"
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white hover:text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 inline-block text-center"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">HealthChain</span>
              </div>
              <p className="text-gray-400 mb-4">
                Revolutionizing healthcare with blockchain technology for secure,
                transparent, and patient-centric medical services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/patient/register" className="hover:text-white transition-colors">Patient Registration</a></li>
                <li><a href="/doctor/register" className="hover:text-white transition-colors">Doctor Registration</a></li>
                <li><a href="/admin/dashboard" className="hover:text-white transition-colors">Admin Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} HealthChain. All rights reserved. Built with ❤️ for better healthcare.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;
