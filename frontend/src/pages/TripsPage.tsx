import React, { useState, useEffect, useCallback } from 'react';
import { Trip, Driver, Vehicle, Client, CreateTripRequest } from '../types/index';
import { TripForm } from '../components/trips/TripForm';
import { Modal } from '../components/common/Modal';
import { FuelFormModal } from '../components/fuel/FuelFormModal';
import { useApi } from '../hooks/useApi';

export const TripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [selectedVehicleForFuel, setSelectedVehicleForFuel] = useState<Vehicle | null>(null);
  const [selectedTripForFuel, setSelectedTripForFuel] = useState<Trip | null>(null);

  // Use the API hook with default base URL
  const { post, get, put } = useApi();

  // Load drivers with useCallback
  const loadDrivers = useCallback(async () => {
    try {
      const response = await get('/drivers?limit=100');
      if (response && response.data) {
        setDrivers(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  }, [get]);

  // Load vehicles with useCallback
  const loadVehicles = useCallback(async () => {
    try {
      const response = await get('/vehicles?limit=100');
      if (response && response.data) {
        setVehicles(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }, [get]);

  // Load clients with useCallback
  const loadClients = useCallback(async () => {
    try {
      const response = await get('/clients?limit=100');
      if (response && response.data) {
        setClients(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }, [get]);

  // Load trips with useCallback
  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get('/trips?limit=50');
      if (response && response.data) {
        setTrips(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  }, [get]);

  // Load initial data on mount
  useEffect(() => {
    loadDrivers();
    loadVehicles();
    loadClients();
    loadTrips();
  }, [loadDrivers, loadVehicles, loadClients, loadTrips]);

  const handleSubmit = async (formData: CreateTripRequest) => {
    try {
      setFormLoading(true);
      const response = selectedTrip
        ? await put(`/trips/${selectedTrip.id}`, formData)
        : await post('/trips', formData);

      if (!response || !response.success) {
        throw new Error(selectedTrip ? 'Error al actualizar el viaje' : 'Error al crear el viaje');
      }

      await loadTrips();
      setShowForm(false);
      setSelectedTrip(null);
      alert(selectedTrip ? 'Viaje actualizado exitosamente' : 'Viaje cargado exitosamente');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(selectedTrip ? 'Error al actualizar el viaje' : 'Error al cargar el viaje');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedTrip(null);
  };

  const handleOpenFuelModal = (trip: Trip) => {
    const vehicle = vehicles.find((v) => v.id === trip.vehicle_id);
    if (vehicle) {
      setSelectedVehicleForFuel(vehicle);
      setSelectedTripForFuel(trip);
      setIsFuelModalOpen(true);
    }
  };

  const handleCloseFuelModal = () => {
    setIsFuelModalOpen(false);
    setSelectedVehicleForFuel(null);
    setSelectedTripForFuel(null);
  };

  const handleFuelSuccess = () => {
    // Reload trips to get the updated fuel logs
    loadTrips();
    handleCloseFuelModal();
  };

  // Map Prisma Trip to CreateTripRequest format for the form
  const mappedInitialData = selectedTrip
    ? {
        date: selectedTrip.scheduled_date
          ? new Date(selectedTrip.scheduled_date).toISOString().split('T')[0]
          : new Date(selectedTrip.created_at).toISOString().split('T')[0],
        driver_id: selectedTrip.driver_id,
        vehicle_id: selectedTrip.vehicle_id,
        client_id: selectedTrip.client_id || '',
        bill_of_lading: selectedTrip.reference_number || selectedTrip.bill_of_lading,
        estimated_km: selectedTrip.distance_km || selectedTrip.estimated_km,
        km_start: selectedTrip.km_start,
        km_end: selectedTrip.km_end,
        amount_to_pay: selectedTrip.estimated_cost || selectedTrip.amount_to_pay,
        per_diems_delivered: selectedTrip.per_diems_delivered,
        unforesee_expenses: selectedTrip.unforesee_expenses || [],
        fuelLogs: selectedTrip.fuelLogs && Array.isArray(selectedTrip.fuelLogs) ? selectedTrip.fuelLogs : [],
        is_active: selectedTrip.is_active,
        origin: (selectedTrip as any).origin,
        destination: (selectedTrip as any).destination,
        status: (selectedTrip as any).status,
        loaded_weight_kg: (selectedTrip as any).loaded_weight_kg,
        net_weight_kg: (selectedTrip as any).net_weight_kg,
        rate_per_kg: (selectedTrip as any).rate_per_kg,
      }
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Viajes</h1>
          <p className="text-gray-600 mt-1">Gestión de viajes y cargas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nuevo Viaje
        </button>
      </div>

      {/* Trip Form Modal */}
      <Modal isOpen={showForm} onClose={handleCloseForm} title={selectedTrip ? 'Editar Viaje' : 'Cargar Nuevo Viaje'} size="xl">
        <TripForm
          drivers={drivers}
          vehicles={vehicles}
          clients={clients}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          loading={formLoading}
          initialData={mappedInitialData}
        />
      </Modal>

      {/* Fuel Form Modal */}
      <FuelFormModal
        isOpen={isFuelModalOpen}
        onClose={handleCloseFuelModal}
        vehicle={selectedVehicleForFuel}
        trip={selectedTripForFuel}
        onSuccess={handleFuelSuccess}
      />

      {/* Trips Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Chofer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Número de Referencia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Distancia (KM)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Honorarios
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Viáticos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Gastos de Ruta
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <div className="inline-block">
                      <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No hay viajes registrados
                  </td>
                </tr>
              ) : (
                trips.map((trip) => {
                  const driver = drivers.find((d) => d.id === trip.driver_id);
                  const vehicle = vehicles.find((v) => v.id === trip.vehicle_id);
                  return (
                    <tr
                      key={trip.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(trip.scheduled_date || trip.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver?.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle?.plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.client?.business_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.reference_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {Number(trip.distance_km || 0).toFixed(2)} km
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        ${Number(trip.estimated_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        ${Number(trip.per_diems_delivered || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {Array.isArray(trip.unforesee_expenses) && trip.unforesee_expenses.length > 0 ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-gray-900 font-medium">
                              ${trip.unforesee_expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0).toFixed(2)}
                            </span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                              {trip.unforesee_expenses.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2 flex items-center justify-center">
                        <button
                          onClick={() => handleEditTrip(trip)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 font-medium rounded hover:bg-blue-200 transition-colors text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleOpenFuelModal(trip)}
                          title="Cargar Combustible"
                          className="px-3 py-1 bg-amber-100 text-amber-700 font-medium rounded hover:bg-amber-200 transition-colors text-xs flex items-center gap-1"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Gasoil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
