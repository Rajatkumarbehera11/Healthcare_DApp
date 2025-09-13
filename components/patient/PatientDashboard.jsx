"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";

const PatientDashboard = () => {
  const { address, isConnected } = useAccount();
  const { patientData, refetchPatient } = useHealthcareContract();

  useEffect(() => {
    if (isConnected && address && !patientData) {
      refetchPatient();
    }
  }, [isConnected, address, patientData, refetchPatient]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h2>
          <p>You need to connect your wallet to access the patient dashboard.</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Patient Not Registered</h2>
          <p className="mb-6">You need to register as a patient to access this dashboard.</p>
          <Link href="/patient/register" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
            Register as Patient
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex">
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Patient Dashboard</h1>
          <p className="text-cyan-400">Welcome back, {patientData.name}!</p>
        </div>

        {/* Patient Info Card */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 mb-8 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
          <h2 className="text-xl font-semibold text-cyan-300 mb-4">Your Information</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-cyan-900 p-4 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg">
              <p className="text-sm text-cyan-400">Name</p>
              <p className="text-lg font-semibold">{patientData.name}</p>
            </div>
            <div className="bg-cyan-900 p-4 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg">
              <p className="text-sm text-cyan-400">Age</p>
              <p className="text-lg font-semibold">{patientData.age?.toString()}</p>
            </div>
            <div className="bg-cyan-900 p-4 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg">
              <p className="text-sm text-cyan-400">Gender</p>
              <p className="text-lg font-semibold">{patientData.gender}</p>
            </div>
            <div className="bg-cyan-900 p-4 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg">
              <p className="text-sm text-cyan-400">Wallet Address</p>
              <p className="text-sm font-mono">{patientData.patientAddress.slice(0, 6)}...{patientData.patientAddress.slice(-4)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/patient/appointment" className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-cyan-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-cyan-600 transition-colors">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 group-hover:text-white">Book Appointment</h3>
                <p className="text-gray-400 group-hover:text-gray-300">Schedule a visit with a doctor</p>
              </div>
            </div>
          </Link>

          <Link href="/patient/history" className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-teal-600 transition-colors">
                <svg className="w-6 h-6 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-300 group-hover:text-white">Medical History</h3>
                <p className="text-gray-400 group-hover:text-gray-300">View your medical records</p>
              </div>
            </div>
          </Link>

          <Link href="/patient/prescriptions" className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-teal-600 transition-colors">
                <svg className="w-6 h-6 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-300 group-hover:text-white">Prescriptions</h3>
                <p className="text-gray-400 group-hover:text-gray-300">View your prescriptions</p>
              </div>
            </div>
          </Link>

          <Link href="/patient/profile" className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-teal-600 transition-colors">
                <svg className="w-6 h-6 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-300 group-hover:text-white">Profile</h3>
                <p className="text-gray-400 group-hover:text-gray-300">Manage your profile</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-teal-300 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-900 rounded-lg">
              <div className="w-10 h-10 bg-teal-700 rounded-full flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-300">Welcome to Healthcare DApp</p>
                <p className="text-sm text-gray-400">You have successfully registered as a patient</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
