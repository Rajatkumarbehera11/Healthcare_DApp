"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";

const DoctorDashboard = () => {
  const { address, isConnected } = useAccount();
  const {
    doctorData,
    refetchDoctor,
    userRole,
    isLoadingRole,
    getDoctorAppointments,
  } = useHealthcareContract();

  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  useEffect(() => {
    if (isConnected && address && !doctorData && userRole === 'doctor') {
      refetchDoctor();
    }
  }, [isConnected, address, doctorData, refetchDoctor, userRole]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!doctorData || !address) return;

      setIsLoadingAppointments(true);
      try {
        const appointmentsData = await getDoctorAppointments(address);

        const processedAppointments = await Promise.all(
          appointmentsData.map(async (appointment) => {
            return {
              id: appointment.id,
              patientId: appointment.patientId,
              patientName: `Patient ID: ${appointment.patientId}`,
              date: new Date(appointment.timestamp * 1000).toLocaleDateString(),
              time: new Date(appointment.timestamp * 1000).toLocaleTimeString(),
              status: appointment.status,
              timestamp: appointment.timestamp
            };
          })
        );

        processedAppointments.sort((a, b) => b.timestamp - a.timestamp);
        setAppointments(processedAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    if (doctorData) {
      fetchAppointments();
    }
  }, [doctorData, address, getDoctorAppointments]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h2>
          <p>You need to connect your wallet to access the doctor dashboard.</p>
        </div>
      </div>
    );
  }

  if (isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-6">You need to be registered as a doctor to access this dashboard.</p>
          {userRole === 'patient' ? (
            <Link
              href="/patient/dashboard"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Go to Patient Dashboard
            </Link>
          ) : (
            <Link
              href="/doctor/register"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Register as Doctor
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!doctorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Doctor Not Found</h2>
          <p className="mb-6">Unable to load your doctor information.</p>
          <button
            onClick={() => refetchDoctor()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex">
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Doctor Dashboard</h1>
          <p className="text-cyan-400">Welcome back, Dr. {doctorData.name}!</p>
        </div>

        {/* Doctor Info Card */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 mb-8 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
          <h2 className="text-xl font-semibold text-cyan-300 mb-4">Your Information</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-cyan-900 p-4 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg">
              <p className="text-sm text-cyan-400">Name</p>
              <p className="text-lg font-semibold">Dr. {doctorData.name}</p>
            </div>
            <div className="bg-cyan-900 p-4 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg">
              <p className="text-sm text-cyan-400">Specialization</p>
              <p className="text-lg font-semibold">{doctorData.specialization}</p>
            </div>
            <div className="bg-cyan-900 p-4 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg">
              <p className="text-sm text-cyan-400">Wallet Address</p>
              <p className="text-sm font-mono">{doctorData.doctorAddress.slice(0, 6)}...{doctorData.doctorAddress.slice(-4)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/doctor/appointments"
            className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-cyan-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-cyan-600 transition-colors">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 group-hover:text-white">Appointments</h3>
                <p className="text-gray-400 group-hover:text-gray-300">Manage your appointments</p>
              </div>
            </div>
          </Link>

          <Link
            href="/doctor/patients"
            className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-teal-600 transition-colors">
                <svg className="w-6 h-6 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-300 group-hover:text-white">Patients</h3>
                <p className="text-gray-400 group-hover:text-gray-300">View your patients</p>
              </div>
            </div>
          </Link>

          <Link
            href="/doctor/records"
            className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-teal-600 transition-colors">
                <svg className="w-6 h-6 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-300 group-hover:text-white">Medical Records</h3>
                <p className="text-gray-400 group-hover:text-gray-300">Add medical records</p>
              </div>
            </div>
          </Link>

          <Link
            href="/doctor/prescribe"
            className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-teal-600 transition-colors">
                <svg className="w-6 h-6 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-300 group-hover:text-white">Prescribe Medicine</h3>
                <p className="text-gray-400 group-hover:text-gray-300">Create prescriptions</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Appointments */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-teal-300 mb-4">Recent Appointments</h2>

          {isLoadingAppointments ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
              <p className="mt-2">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No appointments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-teal-700 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-teal-300">{appointment.patientName}</p>
                      <p className="text-sm text-gray-400">{appointment.date} at {appointment.time}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    appointment.status === 'Booked' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {appointments.length > 5 && (
            <div className="mt-6 text-center">
              <Link
                href="/doctor/appointments"
                className="text-teal-400 hover:text-teal-600 text-sm font-medium"
              >
                View all appointments →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
