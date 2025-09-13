import React, { useEffect, useState } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

const PatientBookAppointment = () => {
  const { address, isConnected } = useAccount();
  const {
    bookAppointment,
    getAllDoctors,
    getPatientAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
  } = useHealthcareContract();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [bookedSlots, setBookedSlots] = useState(new Set());
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);

  // Fetch all doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const allDoctors = await getAllDoctors();
        setDoctors(allDoctors || []);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
        toast.error("Failed to load doctors");
      }
    };
    fetchDoctors();
  }, [getAllDoctors]);

  // Fetch patient appointments for real-time updates
  useEffect(() => {
    if (!address) return;
    const fetchAppointments = async () => {
      try {
        const appointments = await getPatientAppointments(address);
        const currentTime = Math.floor(Date.now() / 1000);

        // Separate upcoming and past appointments
        const upcoming = [];
        const history = [];

        appointments.forEach(appointment => {
          if (appointment.timestamp > currentTime) {
            upcoming.push(appointment);
          } else {
            history.push(appointment);
          }
        });

        // Sort upcoming appointments by date (earliest first)
        upcoming.sort((a, b) => a.timestamp - b.timestamp);

        // Sort history by date (most recent first)
        history.sort((a, b) => b.timestamp - a.timestamp);

        setPatientAppointments(upcoming);
        setAppointmentHistory(history);
      } catch (error) {
        console.error("Failed to fetch patient appointments:", error);
      }
    };
    fetchAppointments();

    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);

    return () => clearInterval(interval);
  }, [address, getPatientAppointments]);

  // Fetch doctor's appointments when doctor and date are selected
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setBookedSlots(new Set());
      setDoctorAppointments([]);
      return;
    }

    const fetchDoctorAppointments = async () => {
      try {
        // Find the doctor's address from the doctors list
        const selectedDoctor = doctors.find(doc => doc.id.toString() === selectedDoctorId);
        if (!selectedDoctor) return;

        const appointments = await getDoctorAppointments(selectedDoctor.address);
        setDoctorAppointments(appointments || []);

        // Filter appointments for the selected date and create booked slots
        const selectedDateObj = new Date(selectedDate);
        const bookedTimes = new Set();

        appointments.forEach(appointment => {
          const appointmentDate = new Date(Number(appointment.timestamp) * 1000);
          if (
            appointmentDate.getFullYear() === selectedDateObj.getFullYear() &&
            appointmentDate.getMonth() === selectedDateObj.getMonth() &&
            appointmentDate.getDate() === selectedDateObj.getDate() &&
            appointment.status !== "Cancelled"
          ) {
            const timeString = appointmentDate.toTimeString().slice(0, 5); // HH:MM format
            bookedTimes.add(timeString);
          }
        });

        setBookedSlots(bookedTimes);
      } catch (error) {
        console.error("Failed to fetch doctor appointments:", error);
        setBookedSlots(new Set());
        setDoctorAppointments([]);
      }
    };

    fetchDoctorAppointments();
  }, [selectedDoctorId, selectedDate, doctors, getDoctorAppointments]);

  const handleBooking = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      toast.error("Please select doctor, date, and time");
      return;
    }

    // Check if the selected time slot is already booked
    if (bookedSlots.has(selectedTime)) {
      toast.error("This time slot is already booked. Please select a different time.");
      return;
    }

    // Convert selected date and time to timestamp
    const dateTimeString = `${selectedDate}T${selectedTime}:00`;
    const timestamp = Math.floor(new Date(dateTimeString).getTime() / 1000);

    if (timestamp <= Math.floor(Date.now() / 1000)) {
      toast.error("Please select a future date and time");
      return;
    }

    setLoading(true);
    try {
      await bookAppointment(selectedDoctorId, timestamp);

      // Get selected doctor details for confirmation message
      const selectedDoctor = doctors.find(doc => doc.id.toString() === selectedDoctorId);
      const doctorName = selectedDoctor ? selectedDoctor.name : `Doctor ID: ${selectedDoctorId}`;
      const appointmentDate = new Date(timestamp * 1000);

      // Enhanced confirmation notification
      toast.success(
        `Appointment booked successfully!\n\nDoctor: ${doctorName}\nDate: ${appointmentDate.toLocaleDateString()}\nTime: ${appointmentDate.toLocaleTimeString()}\n\nPlease arrive 15 minutes early.`,
        { duration: 6000 }
      );

      // Refresh appointments and update booked slots
      const updatedAppointments = await getPatientAppointments(address);
      setPatientAppointments(updatedAppointments || []);

      // Refresh doctor's appointments to update booked slots
      if (selectedDoctorId && selectedDate) {
        const appointments = await getDoctorAppointments(selectedDoctor.address);
        setDoctorAppointments(appointments || []);

        const selectedDateObj = new Date(selectedDate);
        const bookedTimes = new Set();
        appointments.forEach(appointment => {
          const appointmentDate = new Date(Number(appointment.timestamp) * 1000);
          if (
            appointmentDate.getFullYear() === selectedDateObj.getFullYear() &&
            appointmentDate.getMonth() === selectedDateObj.getMonth() &&
            appointmentDate.getDate() === selectedDateObj.getDate() &&
            appointment.status !== "Cancelled"
          ) {
            const timeString = appointmentDate.toTimeString().slice(0, 5);
            bookedTimes.add(timeString);
          }
        });
        setBookedSlots(bookedTimes);
      }

      // Reset form
      setSelectedDoctorId("");
      setSelectedDate("");
      setSelectedTime("");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      await updateAppointmentStatus(appointmentId, "Cancelled");
      toast.success("Appointment cancelled successfully");

      // Refresh appointments
      const updatedAppointments = await getPatientAppointments(address);
      const currentTime = Math.floor(Date.now() / 1000);

      // Separate upcoming and past appointments
      const upcoming = [];
      const history = [];

      updatedAppointments.forEach(appointment => {
        if (appointment.timestamp > currentTime) {
          upcoming.push(appointment);
        } else {
          history.push(appointment);
        }
      });

      // Sort upcoming appointments by date (earliest first)
      upcoming.sort((a, b) => a.timestamp - b.timestamp);

      // Sort history by date (most recent first)
      history.sort((a, b) => b.timestamp - a.timestamp);

      setPatientAppointments(upcoming);
      setAppointmentHistory(history);
    } catch (error) {
      console.error("Cancel appointment error:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  // Additional features to be implemented:
  // - Appointment confirmation notifications
  // - Appointment history views
  // - Appointment cancellation functionality for patients
  // - Responsive design improvements for mobile devices

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Connect Your Wallet</h2>
          <p className="text-gray-600">You need to connect your wallet to book an appointment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
          <p className="text-gray-600">Schedule a visit with a healthcare professional</p>
        </div>

        {/* Appointment Booking Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-900">Select Doctor</label>
            <select
              className="w-full p-2 rounded bg-blue-50 text-gray-900"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
            >
              <option value="">-- Select a Doctor --</option>
              {doctors.map((doc) => (
                <option key={doc.id.toString()} value={doc.id.toString()}>
                  {doc.name} - {doc.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold text-gray-900">Select Date</label>
              <input
                type="date"
                className="w-full p-2 rounded bg-blue-50 text-gray-900"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-900">Select Time</label>
              <input
                type="time"
                className="w-full p-2 rounded bg-blue-50 text-gray-900"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleBooking}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Booking..." : "Book Appointment"}
          </button>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Upcoming Appointments</h2>
          {patientAppointments.length === 0 ? (
            <p className="text-gray-600">No upcoming appointments.</p>
          ) : (
            <ul className="space-y-4">
              {patientAppointments.map((appt) => {
                const apptDate = new Date(Number(appt.timestamp) * 1000);
                const selectedDoctor = doctors.find(doc => doc.id.toString() === appt.doctorId);
                const doctorName = selectedDoctor ? selectedDoctor.name : `Doctor ID: ${appt.doctorId}`;
                return (
                  <li key={appt.id} className="bg-blue-50 p-4 rounded flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Appointment with {doctorName}
                      </p>
                      <p className="text-gray-700">
                        Date: {apptDate.toLocaleDateString()} Time: {apptDate.toLocaleTimeString()}
                      </p>
                      <p className="text-gray-700">Status: {appt.status}</p>
                    </div>
                    {appt.status !== "Cancelled" && (
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Appointment History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment History</h2>
          {appointmentHistory.length === 0 ? (
            <p className="text-gray-600">No past appointments.</p>
          ) : (
            <ul className="space-y-4">
              {appointmentHistory.map((appt) => {
                const apptDate = new Date(Number(appt.timestamp) * 1000);
                const selectedDoctor = doctors.find(doc => doc.id.toString() === appt.doctorId);
                const doctorName = selectedDoctor ? selectedDoctor.name : `Doctor ID: ${appt.doctorId}`;
                return (
                  <li key={appt.id} className="bg-blue-50 p-4 rounded">
                    <p className="font-semibold text-gray-900">
                      Appointment with {doctorName}
                    </p>
                    <p className="text-gray-700">
                      Date: {apptDate.toLocaleDateString()} Time: {apptDate.toLocaleTimeString()}
                    </p>
                    <p className="text-gray-700">Status: {appt.status}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientBookAppointment;
