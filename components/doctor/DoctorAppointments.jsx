import React, { useEffect, useState } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

const DoctorAppointments = () => {
  const { address, isConnected } = useAccount();
  const {
    getDoctorAppointments,
    updateAppointmentStatus,
    getPatientById,
  } = useHealthcareContract();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Fetch doctor's appointments on mount and when address changes
  useEffect(() => {
    if (!address || !isConnected) return;
    fetchAppointments();
  }, [address, isConnected]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const appointmentsData = await getDoctorAppointments(address);
      // Process appointments to include patient information
      const processedAppointments = await Promise.all(
        appointmentsData.map(async (appointment) => {
          try {
            const patientData = await getPatientById(appointment.patientId);
            return {
              ...appointment,
              patientName: patientData ? patientData.name : `Patient ID: ${appointment.patientId}`,
              patientAge: patientData ? patientData.age : "N/A",
              patientGender: patientData ? patientData.gender : "N/A",
            };
          } catch (error) {
            console.error(`Error fetching patient for appointment ${appointment.id}:`, error);
            return {
              ...appointment,
              patientName: `Patient ID: ${appointment.patientId}`,
              patientAge: "N/A",
              patientGender: "N/A",
            };
          }
        })
      );
      // Sort by timestamp (most recent first)
      processedAppointments.sort((a, b) => b.timestamp - a.timestamp);
      setAppointments(processedAppointments);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdatingStatus(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      toast.success(`Appointment status updated to ${newStatus}`);
      // Refresh appointments
      await fetchAppointments();
    } catch (error) {
      console.error("Failed to update appointment status:", error);
      toast.error("Failed to update appointment status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Please connect your wallet to view appointments.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Appointments</h1>

      {loading ? (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <p className="mt-2">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium">No appointments</h3>
          <p className="mt-1 text-sm text-gray-400">You have no scheduled appointments yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const apptDate = new Date(appointment.timestamp * 1000);
            return (
              <div key={appointment.id} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Appointment #{appointment.id}
                    </h3>
                    <p className="text-gray-300 mb-1">
                      <strong>Patient:</strong> {appointment.patientName}
                    </p>
                    <p className="text-gray-300 mb-1">
                      <strong>Age:</strong> {appointment.patientAge} | <strong>Gender:</strong> {appointment.patientGender}
                    </p>
                    <p className="text-gray-300 mb-1">
                      <strong>Date:</strong> {apptDate.toLocaleDateString()} | <strong>Time:</strong> {apptDate.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'Booked' ? 'bg-blue-900 text-blue-200' :
                      appointment.status === 'Completed' ? 'bg-green-900 text-green-200' :
                      'bg-red-900 text-red-200'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>

                {appointment.status === 'Booked' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusUpdate(appointment.id, 'Completed')}
                      disabled={updatingStatus === appointment.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                      {updatingStatus === appointment.id ? 'Updating...' : 'Mark as Completed'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(appointment.id, 'Cancelled')}
                      disabled={updatingStatus === appointment.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                      {updatingStatus === appointment.id ? 'Updating...' : 'Cancel Appointment'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
