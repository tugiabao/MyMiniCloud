import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useDevices } from '../controllers/useDevices';
import { AquariumCard } from '../components/aquarium/AquariumCard';
import { AddAquariumCard } from '../components/common/AddAquariumCard'; // Card dấu cộng bạn đã làm
import { RegisterSystemModal } from '../components/common/RegisterSystemModal';
import { MainLayout } from '../components/layout/MainLayout';
import { useLanguage } from '../context/LanguageContext';
import { NotificationPopup, type NotificationType } from '../components/common/NotificationPopup';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { systems, fetchSystems, registerNewSystem, unregisterSystem, loading } = useDevices();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { t } = useLanguage();
  const [notification, setNotification] = useState<{ message: string, type: NotificationType } | null>(null);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const handleRegister = async (name: string) => {
    try {
      const res = await registerNewSystem(name);
      setNotification({ message: res.message, type: 'success' });
      setIsModalOpen(false);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message: string }>;
      setNotification({ message: axiosError.response?.data?.message || t('action_failed'), type: 'error' });
    }
  };

  const handleDeleteSystem = async (systemName: string) => {
    try {
      const success = await unregisterSystem(systemName);
      if (success) {
        setNotification({ message: t('system_deleted_success') || "Xóa hệ thống thành công", type: 'success' });
      }
    } catch (err: unknown) {
      setNotification({ message: t('system_delete_failed') || "Xóa hệ thống thất bại", type: 'error' });
    }
  };

  return (
    <MainLayout>
      {notification && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="flex justify-center items-center mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-4xl font-bold text-slate-800 dark:text-white">{t('my_devices')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AddAquariumCard onClick={() => setIsModalOpen(true)} />

        {Array.isArray(systems) && systems.map((s) => (
          <AquariumCard
            key={s.name}
            data={{
              name: s.name,
              temp: 0,
              isWaterLow: false,
              isActive: s.is_active,
            }}
            onClick={(id: string) => navigate(`/aquarium/${id}`)}
            onDelete={handleDeleteSystem}
          />
        ))}
      </div>

      <RegisterSystemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRegister}
        loading={loading}
      />
    </MainLayout>
  );
};