"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";

const AdminDashboard = () => {
  const { address, isConnected } = useAccount();
  const { userRole, isLoadingRole, getTotalCounts, listenToDoctorRegistered, listenToAppointmentBooked, listenToAppointmentStatusUpdated } = useHealthcareContract();

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingAppointments: 0
  });

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Function to fetch stats from contract
  const fetchStats = useCallback(async () => {
    if (!isConnected || userRole !== 'admin') return;

    setIsLoadingStats(true);
    try {
      const counts = await getTotalCounts();
      setStats({
        totalPatients: counts.totalPatients,
        totalDoctors: counts.totalDoctors,
        totalAppointments: counts.totalAppointments,
        pendingAppointments: 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [isConnected, userRole, getTotalCounts]);

  // Function to fetch recent activities
  const fetchActivities = useCallback(async () => {
    if (!isConnected || userRole !== 'admin') return;

    setIsLoadingActivities(true);
    try {
      setRecentActivities([]);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [isConnected, userRole]);

  // Event handlers for real-time updates
  const handleDoctorRegistered = useCallback((event) => {
    const { name } = event.args || {};
    setRecentActivities((prev) => [
      {
        type: 'New Doctor Added',
        description: `${name} joined the platform`,
        timestamp: Date.now(),
        iconColor: 'green',
      },
      ...prev,
    ]);
    fetchStats();
  }, [fetchStats]);

  const handleAppointmentBooked = useCallback((event) => {
    const { patientId, doctorId, timestamp } = event.args || {};
    setRecentActivities((prev) => [
      {
        type: 'Appointment Booked',
        description: `Appointment scheduled between Doctor ID ${doctorId} and Patient ID ${patientId}`,
        timestamp: timestamp ? timestamp * 1000 : Date.now(),
        iconColor: 'purple',
      },
      ...prev,
    ]);
    fetchStats();
  }, [fetchStats]);

  const handleAppointmentStatusUpdated = useCallback((event) => {
    const { appointmentId, status } = event.args || {};
    setRecentActivities((prev) => [
      {
        type: 'Appointment Status Updated',
        description: `Appointment ID ${appointmentId} status updated to ${status}`,
        timestamp: Date.now(),
        iconColor: 'yellow',
      },
      ...prev,
    ]);
    fetchStats();
  }, [fetchStats]);

  // Setup event listeners for real-time updates
  useEffect(() => {
    if (!isConnected || userRole !== 'admin') return;

    const unsubscribeDoctor = listenToDoctorRegistered(handleDoctorRegistered);
    const unsubscribeAppointmentBooked = listenToAppointmentBooked(handleAppointmentBooked);
    const unsubscribeAppointmentStatusUpdated = listenToAppointmentStatusUpdated(handleAppointmentStatusUpdated);

    return () => {
      if (unsubscribeDoctor) unsubscribeDoctor();
      if (unsubscribeAppointmentBooked) unsubscribeAppointmentBooked();
      if (unsubscribeAppointmentStatusUpdated) unsubscribeAppointmentStatusUpdated();
    };
  }, [isConnected, userRole, listenToDoctorRegistered, listenToAppointmentBooked, listenToAppointmentStatusUpdated, handleDoctorRegistered, handleAppointmentBooked, handleAppointmentStatusUpdated]);

  // Combined fetch function
  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchStats(), fetchActivities()]);
  }, [fetchStats, fetchActivities]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h2>
          <p>You need to connect your wallet to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have admin privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex">
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-teal-400">Manage your healthcare platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-cyan-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Patients</p>
                <p className="text-2xl font-bold">{isLoadingStats ? "..." : stats.totalPatients}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-cyan-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Doctors</p>
                <p className="text-2xl font-bold">{isLoadingStats ? "..." : stats.totalDoctors}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-cyan-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Appointments</p>
                <p className="text-2xl font-bold">{isLoadingStats ? "..." : stats.totalAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-cyan-700 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending Appointments</p>
                <p className="text-2xl font-bold">{isLoadingStats ? "..." : stats.pendingAppointments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/admin/doctors" className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-cyan-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-cyan-600 transition-colors">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 group-hover:text-white">Manage Doctors</h3>
                <p className="text-gray-400 group-hover:text-gray-300">Add, remove, and manage doctors</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/appointments" className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-6 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)] cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-cyan-700 rounded-lg flex items-center justify-center mr-4 group-hover:bg-cyan-600 transition-colors">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 group-hover:text-white">Manage Appointments</h3>
                <p className="text-gray-400 group-hover:text-gray-300">View and manage all appointments</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-teal-300 mb-4">Recent Activity</h2>
          {isLoadingActivities ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No recent activities found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-900 rounded-lg">
                  <div className={`w-10 h-10 bg-${activity.iconColor}-700 rounded-full flex items-center justify-center mr-4`}>
                    <svg className={`w-5 h-5 text-${activity.iconColor}-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {activity.iconColor === 'blue' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      )}
                      {activity.iconColor === 'green' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                      {activity.iconColor === 'yellow' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-teal-300">{activity.type}</p>
                    <p className="text-sm text-gray-400">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp ? new Date(activity.timestamp * 1000).toLocaleString() : 'Recently'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
